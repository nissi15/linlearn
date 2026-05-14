export interface LessonSeed {
  id: string;
  order: number;
  title: string;
  explanation: string;
  example: string;
  taskPrompt: string;
  setupCommands: string[];
  successCriteria: Array<{
    check_command: string;
    expected_output: string;
    description: string;
  }>;
}

export interface TopicSeed {
  id: string;
  name: string;
  description: string;
  order: number;
  lessons: LessonSeed[];
}

export const curriculum: TopicSeed[] = [
  {
    id: "file_permissions",
    name: "File Permissions",
    description:
      "Understanding and modifying file permissions in Linux using chmod, ls -l, and more.",
    order: 1,
    lessons: [
      {
        id: "fp_1_reading_permissions",
        order: 1,
        title: "Reading File Permissions",
        explanation: `Every file and folder in Linux has a set of permissions that control who can do what with it.

Run \`ls -l\` in any directory and you'll see something like this:

\`\`\`
-rwxr-x--- 1 alice devs 1024 May 10 deploy.sh
\`\`\`

That first column \`-rwxr-x---\` is the permission string. Here's how to read it:

- The first character is the **type**: \`-\` means a regular file, \`d\` means a directory.
- The next 9 characters are split into **3 groups of 3**:
  - Characters 2-4: what the **owner** (alice) can do
  - Characters 5-7: what the **group** (devs) can do
  - Characters 8-10: what **everyone else** can do

Each group has 3 slots:
- \`r\` = **read** (can see the contents)
- \`w\` = **write** (can change the contents)
- \`x\` = **execute** (can run it as a program)
- \`-\` = **nope**, that permission is off

So \`rwxr-x---\` means:
- Owner: read + write + execute (rwx)
- Group: read + execute (r-x)
- Others: nothing at all (---)

Think of it like a hotel room. The owner has the master key, the group has a limited key, and everyone else is locked out.`,
        example: `Let's decode a real example:

\`\`\`
-rw-r--r-- 1 bob staff 512 May 10 notes.txt
drwxr-x--- 2 bob staff 4096 May 10 projects/
\`\`\`

**notes.txt** (\`-rw-r--r--\`):
- It's a regular file (\`-\`)
- Owner (bob): can read and write (\`rw-\`), but NOT execute
- Group (staff): can only read (\`r--\`)
- Others: can only read (\`r--\`)

**projects/** (\`drwxr-x---\`):
- It's a directory (\`d\`)
- Owner (bob): full access (\`rwx\`)
- Group (staff): can read and enter (\`r-x\`)
- Others: completely locked out (\`---\`)`,
        taskPrompt: `Three files exist in your sandbox. Run \`ls -l\` to see their permissions.

Your task: create a file called \`answers.txt\` where each line describes one file's permissions in plain English. For example:
\`\`\`
public.txt: owner can read and write, group can read, others can read
\`\`\`

Write one line per file, then you're done.`,
        setupCommands: [
          "touch public.txt && chmod 644 public.txt",
          "touch script.sh && chmod 750 script.sh",
          "touch secret.conf && chmod 600 secret.conf",
        ],
        successCriteria: [
          {
            check_command: "test -f answers.txt && echo yes",
            expected_output: "yes",
            description: "answers.txt exists",
          },
          {
            check_command:
              "wc -l < answers.txt | tr -d ' '",
            expected_output: "3",
            description: "answers.txt has 3 lines (one per file)",
          },
        ],
      },
      {
        id: "fp_2_chmod_octal",
        order: 2,
        title: "chmod with Octal Notation",
        explanation: `Now that you can read permissions, let's change them. The command is \`chmod\`.

The most common way to use chmod is with **octal (number) notation**. Each permission has a number:
- **r** (read) = **4**
- **w** (write) = **2**
- **x** (execute) = **1**

You add them up for each group:
- \`rwx\` = 4 + 2 + 1 = **7**
- \`rw-\` = 4 + 2 + 0 = **6**
- \`r-x\` = 4 + 0 + 1 = **5**
- \`r--\` = 4 + 0 + 0 = **4**
- \`---\` = 0 + 0 + 0 = **0**

Then you write three digits: owner, group, others.

\`chmod 755 file\` means:
- Owner: 7 (rwx) — full access
- Group: 5 (r-x) — read and execute
- Others: 5 (r-x) — read and execute

Think of it like a 3-digit combination lock. Each dial goes from 0 to 7.`,
        example: `Here are the most common permission numbers you'll see:

| Number | Permissions | Typical use |
|--------|------------|-------------|
| \`755\` | rwxr-xr-x | Scripts and programs everyone can run |
| \`644\` | rw-r--r-- | Regular files everyone can read |
| \`700\` | rwx------ | Private scripts only you can run |
| \`600\` | rw------- | Private files (passwords, keys) |
| \`640\` | rw-r----- | Files your group can read |

**Quick decode trick**: for any digit, ask:
- Is it >= 4? Then \`r\` is on. Subtract 4.
- Is the remainder >= 2? Then \`w\` is on. Subtract 2.
- Is the remainder >= 1? Then \`x\` is on.

Example: \`6\` → 6 >= 4 so \`r\`, remainder 2 >= 2 so \`w\`, remainder 0 so no \`x\` → \`rw-\``,
        taskPrompt: `Three files exist in the sandbox, all with no permissions (000).

Set them to:
1. \`deploy.sh\` → \`755\` (owner full, everyone else read+execute)
2. \`config.ini\` → \`640\` (owner read+write, group read, others nothing)
3. \`data/\` directory → \`750\` (owner full, group read+execute, others nothing)

Verify your work with \`ls -l\` before typing "done".`,
        setupCommands: [
          "touch deploy.sh",
          "touch config.ini",
          "mkdir -p data",
          "chmod 000 deploy.sh config.ini data",
        ],
        successCriteria: [
          {
            check_command: "stat -c '%a' deploy.sh",
            expected_output: "755",
            description: "deploy.sh has permissions 755",
          },
          {
            check_command: "stat -c '%a' config.ini",
            expected_output: "640",
            description: "config.ini has permissions 640",
          },
          {
            check_command: "stat -c '%a' data",
            expected_output: "750",
            description: "data/ directory has permissions 750",
          },
        ],
      },
      {
        id: "fp_3_chmod_symbolic",
        order: 3,
        title: "chmod with Symbolic Notation",
        explanation: `There's another way to use chmod that some people find easier to read: **symbolic notation**.

Instead of numbers, you use letters and symbols:

**Who:**
- \`u\` = **user** (the owner)
- \`g\` = **group**
- \`o\` = **others**
- \`a\` = **all** (owner + group + others)

**What to do:**
- \`+\` = **add** a permission
- \`-\` = **remove** a permission
- \`=\` = **set exactly** (replaces whatever was there)

**Which permission:**
- \`r\` = read, \`w\` = write, \`x\` = execute

Examples:
- \`chmod u+x file\` → add execute for owner
- \`chmod go-w file\` → remove write from group and others
- \`chmod a=r file\` → set everyone to read-only
- \`chmod u=rwx,g=rx,o= file\` → same as \`chmod 750 file\`

Symbolic is great when you want to change ONE thing without touching the rest. Octal is great when you want to set everything at once.`,
        example: `Here's how octal and symbolic map to each other:

\`chmod 755 file\` is the same as:
\`chmod u=rwx,g=rx,o=rx file\`

But symbolic shines when you only want to tweak one thing:

**Scenario**: A script has \`644\` (rw-r--r--) and you want to make it executable by the owner only.

With octal, you'd need to recalculate: \`chmod 744 file\`
With symbolic, just add what you need: \`chmod u+x file\`

**Scenario**: Remove write from group and others on everything:
\`chmod go-w file\`

You don't need to know or change the owner's permissions at all.`,
        taskPrompt: `Two items exist in the sandbox with permissions set to 000.

Using **only symbolic notation** (no numbers allowed!):
1. Make \`report.sh\` readable and executable by owner and group, but give others no access. (That's \`r-xr-x---\`, or 550 in octal.)
2. Make \`logs/\` directory readable by everyone, but only writable by the owner, and traversable by owner and group. (That's \`rwxr-x--r--\`... wait, think carefully: \`754\`.)

Hint: you can chain permissions like \`chmod u=rwx,g=rx,o=r file\``,
        setupCommands: [
          "touch report.sh",
          "mkdir -p logs",
          "chmod 000 report.sh",
          "chmod 000 logs",
        ],
        successCriteria: [
          {
            check_command: "stat -c '%a' report.sh",
            expected_output: "550",
            description: "report.sh has permissions 550 (r-xr-x---)",
          },
          {
            check_command: "stat -c '%a' logs",
            expected_output: "754",
            description: "logs/ directory has permissions 754 (rwxr-xr--)",
          },
        ],
      },
      {
        id: "fp_4_directory_permissions",
        order: 4,
        title: "Permissions on Directories",
        explanation: `Here's where most people get tripped up: permissions mean **different things** for directories vs files.

For a **file**:
- \`r\` = read the file contents
- \`w\` = modify the file
- \`x\` = run it as a program

For a **directory**:
- \`r\` = **list** what's inside (\`ls\` works)
- \`w\` = **create or delete** files inside
- \`x\` = **traverse** — enter the directory (\`cd\` works) and access files by name

The big gotcha: **without \`x\` on a directory, you can't reach anything inside it**, even if you have \`r\`.

Imagine a hallway with doors. \`r\` lets you see the list of door names. But \`x\` is what lets you actually walk down the hallway and open a door. Without \`x\`, you're stuck at the entrance.

A directory with \`r--\` (read but no execute): you can run \`ls\` and see filenames, but you can't \`cd\` into it or read any file inside. Weird, right?

A directory with \`--x\` (execute but no read): you can \`cd\` into it and access files if you know their names, but \`ls\` won't work — you can't see the list.`,
        example: `Let's see this in action:

\`\`\`bash
mkdir test_dir
echo "secret" > test_dir/file.txt
chmod 644 test_dir    # r-- for owner, NO execute
\`\`\`

Now try:
\`\`\`bash
ls test_dir/           # Works! Shows "file.txt" (you have r)
cat test_dir/file.txt  # FAILS! "Permission denied" (no x to traverse)
cd test_dir/           # FAILS! "Permission denied" (no x to enter)
\`\`\`

Fix it:
\`\`\`bash
chmod 755 test_dir     # Now you have r, w, and x
cat test_dir/file.txt  # Works!
\`\`\`

Common directory permissions:
- \`755\` — standard: everyone can enter and list
- \`750\` — group can enter, others locked out
- \`700\` — only owner can enter
- \`711\` — everyone can traverse but only owner can list contents`,
        taskPrompt: `Create a directory structure and set permissions:

1. Create \`projects/src/\` (nested directories)
2. Set \`projects/\` to \`711\` — everyone can traverse (cd) into it, but only the owner can list its contents
3. Set \`projects/src/\` to \`750\` — owner has full access, group can read and traverse, others locked out

Verify by running \`stat -c '%a' projects\` and \`stat -c '%a' projects/src\`.`,
        setupCommands: [
          "rm -rf projects",
        ],
        successCriteria: [
          {
            check_command: "test -d projects/src && echo yes",
            expected_output: "yes",
            description: "projects/src/ directory exists",
          },
          {
            check_command: "stat -c '%a' projects",
            expected_output: "711",
            description: "projects/ has permissions 711",
          },
          {
            check_command: "stat -c '%a' projects/src",
            expected_output: "750",
            description: "projects/src/ has permissions 750",
          },
        ],
      },
      {
        id: "fp_5_diagnosing_denied",
        order: 5,
        title: "Diagnosing 'Permission Denied'",
        explanation: `When you see "Permission denied", don't panic. There's a simple checklist:

**Step 1: Who am I?**
Run \`whoami\` to see your username, and \`groups\` to see your groups.

**Step 2: Who owns the file?**
Run \`ls -l file\` — the 3rd column is the owner, 4th is the group.

**Step 3: Which column applies to me?**
- Am I the owner? → look at characters 2-4
- Am I in the group? → look at characters 5-7
- Neither? → look at characters 8-10

**Step 4: Do I have the right permission?**
- Trying to read? Need \`r\`
- Trying to write/create? Need \`w\`
- Trying to run a script? Need \`x\` (and \`r\` too — the shell needs to read the script to run it!)
- Trying to \`cd\` into a directory? Need \`x\` on the directory

**Step 5: Check the path**
Even if the file itself is readable, every directory in the path needs \`x\` for you to reach it. If \`/home/bob/docs/file.txt\` has \`644\`, but \`/home/bob/\` has \`700\` and you're not bob, you can't reach the file.

Most "Permission denied" errors fall into 3 categories:
1. Missing \`x\` on a script you're trying to run
2. Missing \`x\` on a parent directory
3. Missing \`w\` when trying to create/modify files`,
        example: `**Scenario**: You try to run a script and get "Permission denied":

\`\`\`bash
$ ./deploy.sh
bash: ./deploy.sh: Permission denied

$ ls -l deploy.sh
-rw-r--r-- 1 you you 45 May 10 deploy.sh
\`\`\`

The file has \`644\` — no execute bit for anyone! Fix:
\`\`\`bash
chmod u+x deploy.sh
./deploy.sh   # Now it works
\`\`\`

**Scenario**: You can see a file exists but can't read it:

\`\`\`bash
$ ls restricted/
secret.txt

$ cat restricted/secret.txt
cat: restricted/secret.txt: Permission denied

$ ls -la restricted/
drwxr-x--- 2 root root 4096 May 10 .
\`\`\`

The directory \`restricted/\` has \`750\` — owner is root, group is root. You're neither, so you have \`---\`. Even though you could list files (someone ran ls before the permission change), you can't traverse into it.`,
        taskPrompt: `Three scripts are in the sandbox, and each one fails to run for a different reason. Your job is to diagnose and fix all three so they execute successfully.

Run each one with \`bash scriptname.sh\` and figure out why it fails. Fix the permissions so all three run.

Hints:
- \`script1.sh\` has a simple permission problem
- \`script2.sh\` is inside a directory — check the directory too
- \`script3.sh\` has a tricky permission issue (think about what bash needs to do with a script file)`,
        setupCommands: [
          "echo '#!/bin/bash\necho script1-ok' > script1.sh",
          "chmod 644 script1.sh",
          "mkdir -p restricted",
          "echo '#!/bin/bash\necho script2-ok' > restricted/script2.sh",
          "chmod 755 restricted/script2.sh",
          "chmod 711 restricted",
          "echo '#!/bin/bash\necho script3-ok' > script3.sh",
          "chmod 111 script3.sh",
        ],
        successCriteria: [
          {
            check_command: "bash script1.sh",
            expected_output: "script1-ok",
            description: "script1.sh runs successfully",
          },
          {
            check_command: "bash restricted/script2.sh",
            expected_output: "script2-ok",
            description: "script2.sh runs successfully from outside restricted/",
          },
          {
            check_command: "bash script3.sh",
            expected_output: "script3-ok",
            description: "script3.sh runs successfully (needs read permission)",
          },
        ],
      },
    ],
  },
  {
    id: "vi_vim",
    name: "Vi / Vim",
    description:
      "Learn vi from scratch in tiny steps — open a file, type, save, move around, edit, search — then build your own StockTrace supplier ledger at the end.",
    order: 2,
    lessons: [
      {
        id: "vi_01_hello",
        order: 1,
        title: "Hello, vi — open, type, save, quit",
        explanation: `Vi is a text editor that has been on every Unix machine since 1976. A guy called **Bill Joy** wrote it. Vim is just a newer, friendlier version (Vi IMproved) — when you type \`vi\` on Ubuntu, you usually get vim. They behave the same for everything in this topic.

Vi is a bit different from editors like Notepad or VS Code: most of the time you are **not typing text**. The keyboard is used to give *commands*. You only type text when you tell vi "now I want to type" by pressing \`i\`.

Three keys are all you need for "open a file, type something, save, quit":

- \`vi filename\` — open the file (or create it if it doesn't exist).
- \`i\` — start typing. (This is called **Insert mode**.)
- \`Esc\` — stop typing. (Back to **Normal mode**, where keys do commands.)
- \`:wq\` then Enter — **w**rite and **q**uit. Saves your changes and closes vi.

That's it. The rest of the lessons each add one or two more keys at a time.`,
        example: `\`\`\`
vi hello.txt          # opens (or creates) the file
i                     # start typing
Hello from Kigali     # actually type this
<Esc>                 # stop typing
:wq                   # save and quit (press Enter after)
\`\`\`

After this, run \`cat hello.txt\` in the terminal — the line you typed will be there.`,
        taskPrompt: `In the terminal, open a new file with \`vi hello.txt\`. Once vi opens:

1. Press \`i\` to start typing.
2. Type exactly: \`Hello from Kigali\`
3. Press \`Esc\`.
4. Type \`:wq\` and press Enter.

You should be back at the shell prompt. Then type **done**.`,
        setupCommands: [
          "rm -f hello.txt",
        ],
        successCriteria: [
          {
            check_command: "test -f hello.txt && echo yes",
            expected_output: "yes",
            description: "hello.txt was created",
          },
          {
            check_command: "grep -c '^Hello from Kigali$' hello.txt | tr -d ' '",
            expected_output: "1",
            description: "hello.txt contains exactly the line 'Hello from Kigali'",
          },
        ],
      },
      {
        id: "vi_02_modes",
        order: 2,
        title: "Two modes — Normal and Insert",
        explanation: `Vi has two modes you'll spend most of your time in:

- **Normal mode** — what you start in when you open vi. Letters are **commands**, not text. \`h\` moves left, \`x\` deletes, and so on.
- **Insert mode** — you can type text like in a normal editor. To get here, press \`i\`.

To switch between them:

- \`i\` — from Normal into Insert (start typing where the cursor is).
- \`Esc\` — from Insert back to Normal.

There's another handy way into Insert mode:

- \`o\` — **o**pen a new line *below* the current one and start typing on it.

If you ever get confused about which mode you're in, just press \`Esc\` once or twice. You're now in Normal mode for sure.`,
        example: `\`\`\`
vi notes.txt
i                     # Insert mode
First line            # type
<Esc>                 # Normal mode
o                     # new line below, automatically in Insert mode
Second line           # type
<Esc>
:wq
\`\`\`

The file now has two lines.`,
        taskPrompt: `Open \`notes.txt\` with \`vi notes.txt\`. It already has one line in it.

Your job: use \`o\` (lowercase) to add a brand new line *below* the existing one. Type exactly: \`done\` on that new line. Then \`Esc\` and \`:wq\` to save.

When finished, \`notes.txt\` should have **2 lines**, and line 2 should be the word \`done\`.`,
        setupCommands: [
          "printf '%s\\n' 'first line' > notes.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < notes.txt | tr -d ' '",
            expected_output: "2",
            description: "notes.txt now has 2 lines",
          },
          {
            check_command: "sed -n '2p' notes.txt",
            expected_output: "done",
            description: "line 2 is the word 'done'",
          },
        ],
      },
      {
        id: "vi_03_hjkl",
        order: 3,
        title: "Moving the cursor with h j k l",
        explanation: `In Normal mode, vi uses four letters on your home row to move the cursor:

- \`h\` — left
- \`j\` — down
- \`k\` — up
- \`l\` — right

That's left, down, up, right (think of \`j\` as the one with a hook going down, and \`k\` as the one going up).

The arrow keys also work. But \`h j k l\` are quicker once your fingers learn them, because your hands never leave the home row. (Bill Joy's keyboard in 1976 didn't even have arrow keys, so this layout stuck.)

**Important**: \`h j k l\` only move the cursor in **Normal mode**. If you're in Insert mode, pressing \`h\` types the letter h instead. Press \`Esc\` first to be sure.`,
        example: `Once vi is open:

\`\`\`
<Esc>          # make sure you're in Normal mode
jjjj           # down 4 lines
ll             # right 2 characters
k              # up 1 line
\`\`\``,
        taskPrompt: `Open \`target.txt\` with \`vi target.txt\`. It has 5 short lines. Line 4 looks like: \`leftXright\`.

Your job: use \`j\` to move the cursor *down* to line 4, then use \`l\` to move *right* until the cursor is on the \`X\`, then press \`x\` (lowercase) to delete just that one character.

Save with \`:wq\`. Line 4 should end up as \`leftright\` (no X).`,
        setupCommands: [
          "printf '%s\\n' 'line one' 'line two' 'line three' 'leftXright' 'line five' > target.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < target.txt | tr -d ' '",
            expected_output: "5",
            description: "no whole lines were removed",
          },
          {
            check_command: "sed -n '4p' target.txt",
            expected_output: "leftright",
            description: "line 4 is now 'leftright' (the X is gone)",
          },
        ],
      },
      {
        id: "vi_04_jumping",
        order: 4,
        title: "Jumping around — 0, $, gg, G",
        explanation: `Walking one character at a time is slow. These four jumps save you loads of presses:

- \`0\` (the digit zero) — jump to the **start of the current line**.
- \`$\` (dollar sign) — jump to the **end of the current line**.
- \`gg\` — jump to the **first line** of the file.
- \`G\` (capital) — jump to the **last line** of the file.

Bonus: type a number before \`G\` to jump to that line. \`5G\` goes to line 5. \`42G\` goes to line 42.

These all work in Normal mode. As always, \`Esc\` first if you're not sure.`,
        example: `\`\`\`
gg            # go to the top of the file
G             # go to the bottom of the file
0             # go to the start of this line
$             # go to the end of this line
5G            # go to line 5
\`\`\``,
        taskPrompt: `Open \`recipe.txt\` with \`vi recipe.txt\`. It has 3 lines.

Your job:

1. Press \`G\` to jump to the **last line**.
2. Press \`0\` to make sure the cursor is at the **start** of that line.
3. Press \`i\` to enter Insert mode and type \`END \` (the word END followed by a space).
4. Press \`Esc\` then \`:wq\` to save.

The last line should now begin with \`END \` followed by what was already there. The file should still have **3 lines** in total.`,
        setupCommands: [
          "printf '%s\\n' 'Step 1: heat oil' 'Step 2: add onions' 'Step 3: stir' > recipe.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < recipe.txt | tr -d ' '",
            expected_output: "3",
            description: "recipe.txt still has 3 lines",
          },
          {
            check_command: "tail -1 recipe.txt",
            expected_output: "END Step 3: stir",
            description: "the last line now starts with 'END '",
          },
        ],
      },
      {
        id: "vi_05_delete",
        order: 5,
        title: "Removing things — x and dd",
        explanation: `Two simple delete keys, used constantly:

- \`x\` — delete the **single character** under the cursor. Like a backspace, but it deletes the character the cursor is *on*, not the one before it.
- \`dd\` — delete the **whole line** the cursor is on. Press \`d\` twice quickly.

Both put what you deleted onto a hidden clipboard, so you can paste it back somewhere else with \`p\` (you'll learn \`p\` in the next lesson).

If you delete the wrong thing, don't worry — you'll learn undo (\`u\`) in lesson 7.`,
        example: `\`\`\`
x             # delete the character under the cursor
xxx           # delete three characters in a row
dd            # delete the entire current line
\`\`\``,
        taskPrompt: `Open \`prices.txt\` with \`vi prices.txt\`. It has 4 lines, and line 3 is exactly \`DELETE THIS LINE\`.

Your job: move to line 3 (\`gg\` then \`jj\`, or \`3G\`), then press \`dd\` to delete that whole line.

Save with \`:wq\`. The file should end up with **3 lines** and contain no \`DELETE THIS LINE\` text.`,
        setupCommands: [
          "printf '%s\\n' 'Maize: 500 RWF' 'Beans: 800 RWF' 'DELETE THIS LINE' 'Flour: 1200 RWF' > prices.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < prices.txt | tr -d ' '",
            expected_output: "3",
            description: "prices.txt has 3 lines (one removed)",
          },
          {
            check_command: "grep -c 'DELETE THIS LINE' prices.txt | tr -d ' '",
            expected_output: "0",
            description: "the 'DELETE THIS LINE' line is gone",
          },
        ],
      },
      {
        id: "vi_06_yank_paste",
        order: 6,
        title: "Copy and paste lines — yy and p",
        explanation: `Vi calls "copy" **yank**. (Don't ask why — that's just the word it uses.)

- \`yy\` — yank (copy) the current line onto the clipboard.
- \`p\` — paste below the cursor.

Move somewhere else, press \`p\`, and the copied line appears on a new line below you.

Cool bit: \`p\` also pastes whatever you last *deleted*. So \`dd\` then move then \`p\` is the vi version of "cut and paste".`,
        example: `\`\`\`
yy            # copy the current line
G             # jump to the last line
p             # paste a copy below
\`\`\``,
        taskPrompt: `Open \`team.txt\` with \`vi team.txt\`. It has 3 lines, and line 2 is \`Nissi\`.

Your job:

1. Move to line 2 (where \`Nissi\` is). \`gg\` then \`j\`, or just \`2G\`.
2. Press \`yy\` to copy that line.
3. Press \`G\` to jump to the bottom.
4. Press \`p\` to paste a copy after the last line.
5. Save with \`:wq\`.

The file should have **4 lines** total, and \`Nissi\` should appear twice (once on line 2, once on the new last line).`,
        setupCommands: [
          "printf '%s\\n' 'Team:' 'Nissi' 'Alex' > team.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < team.txt | tr -d ' '",
            expected_output: "4",
            description: "team.txt has 4 lines now",
          },
          {
            check_command: "grep -c '^Nissi$' team.txt | tr -d ' '",
            expected_output: "2",
            description: "'Nissi' appears on exactly 2 lines",
          },
        ],
      },
      {
        id: "vi_07_undo",
        order: 7,
        title: "Undo with u",
        explanation: `Made a mistake? Press \`u\` in Normal mode. The last change disappears.

- \`u\` — undo the last change. Keep pressing it to undo further back.
- \`Ctrl-r\` — **redo**. Bring back what you just undid.

That's the whole lesson — one key. Use it freely. There's no harm in undoing too much; you can always redo with \`Ctrl-r\`.`,
        example: `\`\`\`
dd            # oh no, deleted the wrong line
u             # undid — line is back
u             # undo the change before that
<Ctrl-r>      # actually that one was fine, bring it back
\`\`\``,
        taskPrompt: `Open \`precious.txt\` with \`vi precious.txt\`. It has 3 lines. Line 2 is \`KEEP THIS\`.

Practise undo:

1. Move to line 2.
2. Press \`dd\` to delete it (just for practice).
3. Now press \`u\` to bring it back.
4. Save with \`:wq\`.

The file should still have **3 lines** and still contain \`KEEP THIS\` exactly as it was.`,
        setupCommands: [
          "printf '%s\\n' 'first' 'KEEP THIS' 'third' > precious.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < precious.txt | tr -d ' '",
            expected_output: "3",
            description: "precious.txt still has 3 lines",
          },
          {
            check_command: "grep -c '^KEEP THIS$' precious.txt | tr -d ' '",
            expected_output: "1",
            description: "'KEEP THIS' is still in the file",
          },
        ],
      },
      {
        id: "vi_08_visual",
        order: 8,
        title: "Selecting regions — visual mode (v and V)",
        explanation: `\`yy\` and \`dd\` work on whole lines. But sometimes you only want to copy or delete **part of a line** or a chunk of several lines. That's what **visual mode** is for: highlight first, then act.

- \`v\` — start a character-by-character selection. Move with \`h j k l\` (or \`w\` for next word, \`$\` for end of line). The text you cover gets highlighted.
- \`V\` (capital) — start a line-by-line selection. Move up or down to grab whole lines.

Once something is highlighted, these keys act on the selection:

- \`d\` — delete it.
- \`y\` — copy (yank) it.
- \`c\` — delete it **and** drop you into Insert mode (handy for replacing).

Press \`Esc\` to cancel a selection without doing anything.`,
        example: `To capitalise \`goodTaste\` to \`Good Taste\` in one move:

\`\`\`
(cursor on the 'g' of goodTaste)
v             # start selection
e             # extend to the end of the word
c             # delete and enter Insert mode
Good Taste    # type the replacement
<Esc>
\`\`\``,
        taskPrompt: `Open \`places.txt\` with \`vi places.txt\`. Line 1 is \`goodTaste in Kigali\`.

Your job: use **visual mode** to change just the word \`goodTaste\` into \`Good Taste\`.

Step by step:

1. \`gg\` then \`0\` to land on the very first character (the \`g\`).
2. \`v\` to start a selection.
3. \`e\` to extend the selection to the end of the word.
4. \`c\` to delete the selection and start typing.
5. Type \`Good Taste\`, then \`Esc\`.
6. \`:wq\` to save.

Line 1 should end up as \`Good Taste in Kigali\` (capital G, space, capital T). Line 2 should be untouched.`,
        setupCommands: [
          "printf '%s\\n' 'goodTaste in Kigali' 'serves food daily' > places.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < places.txt | tr -d ' '",
            expected_output: "2",
            description: "places.txt still has 2 lines",
          },
          {
            check_command: "head -1 places.txt",
            expected_output: "Good Taste in Kigali",
            description: "line 1 is now 'Good Taste in Kigali'",
          },
          {
            check_command: "sed -n '2p' places.txt",
            expected_output: "serves food daily",
            description: "line 2 is unchanged",
          },
        ],
      },
      {
        id: "vi_09_search",
        order: 9,
        title: "Searching — / forward and ? backward",
        explanation: `To find text in a file:

- \`/word\` then Enter — search **forward** (towards the bottom). The cursor jumps to the next match.
- \`?word\` then Enter — search **backward** (towards the top).
- \`n\` — repeat the last search in the **same** direction.
- \`N\` — repeat in the **opposite** direction.

So if you press \`/error\`, then \`n\` keeps going down to find more \`error\` matches. If you press \`?error\`, then \`n\` keeps going **up**.

When should you use \`?\` instead of \`/\`? When the thing you're looking for is **above** the cursor. That's the whole rule.`,
        example: `\`\`\`
/Kigali       # search forward for 'Kigali'
n             # next match (still forward)
?TODO         # search backward for 'TODO'
n             # next match (now backward)
N             # one match the other way (forward)
\`\`\``,
        taskPrompt: `Open \`orders.txt\` with \`vi orders.txt\`. It has 7 lines. The cursor lands at the bottom. There are 3 lines that start with \`URGENT\`.

Your job: use **backward search** (\`?URGENT\`) to jump to the URGENT line **closest to the bottom**, then delete that single line with \`dd\`.

Save with \`:wq\`. After: the file should have **6 lines**, and only **2** of them should start with \`URGENT\`.`,
        setupCommands: [
          "printf '%s\\n' 'order 1: maize' 'URGENT order 2: beans' 'order 3: rice' 'URGENT order 4: oil' 'order 5: salt' 'URGENT order 6: tea' 'order 7: sugar' > orders.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < orders.txt | tr -d ' '",
            expected_output: "6",
            description: "orders.txt has 6 lines (one removed)",
          },
          {
            check_command: "grep -c '^URGENT' orders.txt | tr -d ' '",
            expected_output: "2",
            description: "2 URGENT lines remain (down from 3)",
          },
          {
            check_command: "grep -c '^URGENT order 6' orders.txt | tr -d ' '",
            expected_output: "0",
            description: "the last URGENT entry (order 6) is the one removed",
          },
        ],
      },
      {
        id: "vi_10_commands",
        order: 10,
        title: "Commands by name — the : prompt",
        explanation: `Press \`:\` in Normal mode and the cursor jumps to the **very bottom** of the screen so you can type a **command by name**. This area is called **last-line mode** (some old books call it command mode or ex mode — same thing).

You already use \`:w\` (write), \`:q\` (quit), and \`:wq\` (write and quit). Three more that come up daily:

- \`:set number\` — show line numbers down the left. \`:set nonumber\` to hide them.
- \`:%s/old/new/g\` — find every \`old\` in the whole file and replace it with \`new\`. The \`%\` means "the whole file"; the \`g\` means "every match on each line".
- \`:r !command\` — run a shell command and **paste its output** into your file at the cursor. e.g. \`:r !date\` inserts today's date as a new line.

Press Enter after typing a command. Tab-completion works for filenames.`,
        example: `Rename every \`Place\` to \`City\` everywhere in the file:

\`\`\`
:%s/Place/City/g
\`\`\`

Insert the current date at the bottom of a log:

\`\`\`
G              # go to last line
:r !date       # output of \`date\` is pasted below the current line
\`\`\``,
        taskPrompt: `Open \`log.txt\` with \`vi log.txt\`. It has 3 lines, and each one contains the word \`MAIZE\` in all caps.

Your job: use **one** \`:%s\` command to replace every \`MAIZE\` with \`maize\` (lowercase).

\`\`\`
:%s/MAIZE/maize/g
\`\`\`

Then \`:wq\` to save. After: the file should contain zero \`MAIZE\` (all-caps) and three \`maize\` (lowercase).`,
        setupCommands: [
          "printf '%s\\n' '50kg MAIZE in stock' 'shipped: MAIZE x 10' 'price of MAIZE: 500 RWF' > log.txt",
        ],
        successCriteria: [
          {
            check_command: "grep -c 'MAIZE' log.txt | tr -d ' '",
            expected_output: "0",
            description: "no all-caps MAIZE remains",
          },
          {
            check_command: "grep -c 'maize' log.txt | tr -d ' '",
            expected_output: "3",
            description: "three lowercase 'maize' are present",
          },
          {
            check_command: "wc -l < log.txt | tr -d ' '",
            expected_output: "3",
            description: "still 3 lines",
          },
        ],
      },
      {
        id: "vi_11_stocktrace_project",
        order: 11,
        title: "Project — your StockTrace supplier ledger",
        explanation: `Time to use everything together to build something real for your StockTrace project.

StockTrace is your procurement system for Rwandan restaurants. It needs a supplier ledger — a CSV file listing who supplies what to which restaurant. You're going to type that file from scratch in vi.

You can use **anything** you've learned so far:

- \`i\` to type, \`Esc\` to stop typing.
- \`o\` to open a new line below.
- \`h j k l\`, \`gg\`, \`G\`, \`0\`, \`$\` to move around.
- \`x\`, \`dd\` to remove mistakes.
- \`yy\`, \`p\` to copy a similar row instead of retyping.
- \`u\` to undo if you slip.
- \`v\`, \`V\`, \`c\` for selections.
- \`/\`, \`?\` if you need to find something.
- \`:%s/old/new/g\` to fix typos everywhere at once.
- \`:wq\` to save.

There's no single right path — get the file to the expected end state, however you like.`,
        example: `A small CSV looks like this — a header row first, then one row per record, with values separated by commas:

\`\`\`
name,city,product
Good Taste,Kigali,maize
\`\`\`

Tip: if two rows look almost the same, \`yy\` + \`p\` then tweak the copy is faster than typing it fresh.`,
        taskPrompt: `Create a new file called \`suppliers.csv\` (run \`vi suppliers.csv\`) containing **exactly these 5 lines, in this order**:

\`\`\`
name,city,product
Good Taste,Kigali,maize
Cafe Neo,Kigali,coffee
Heaven Restaurant,Kigali,rice
Fair Food,Musanze,beans
\`\`\`

Then add a **6th line** that begins with \`Last updated:\` (it can be followed by anything — a date, your name, whatever). For example: \`Last updated: 2026-05-12\`.

Save with \`:wq\`. When you're done, the file should have **6 lines** total.

Hints:
- Open with \`vi suppliers.csv\` — the file doesn't exist yet, vi will create it on save.
- After \`i\` you can type all 6 lines at once; press Enter at the end of each line.
- If you mistype a supplier name, \`:%s/wrong/right/g\` fixes every occurrence at once.`,
        setupCommands: [
          "rm -f suppliers.csv",
        ],
        successCriteria: [
          {
            check_command: "wc -l < suppliers.csv | tr -d ' '",
            expected_output: "6",
            description: "suppliers.csv has exactly 6 lines",
          },
          {
            check_command: "head -1 suppliers.csv",
            expected_output: "name,city,product",
            description: "line 1 is the CSV header",
          },
          {
            check_command:
              "grep -c '^Good Taste,Kigali,maize$\\|^Cafe Neo,Kigali,coffee$\\|^Heaven Restaurant,Kigali,rice$\\|^Fair Food,Musanze,beans$' suppliers.csv | tr -d ' '",
            expected_output: "4",
            description: "all 4 supplier rows are present and match exactly",
          },
          {
            check_command: "grep -c '^Last updated:' suppliers.csv | tr -d ' '",
            expected_output: "1",
            description: "the final 'Last updated:' line is there",
          },
        ],
      },
    ],
  },
];
