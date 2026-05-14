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
      "Selecting regions with visual mode, backward search, and the last-line command mode — picking up where the ALU lesson left off.",
    order: 2,
    lessons: [
      {
        id: "vi_1_visual_mode",
        order: 1,
        title: "Visual Mode — selecting regions",
        explanation: `You already know \`x\` deletes a character, \`dd\` deletes a line, \`yy\` copies a line. But what about *part* of a line, or several lines, or a rectangular block? That's what **visual mode** is for: highlight first, act second.

From Normal mode there are three flavours:

- \`v\` — **character-wise** selection. Extend with \`h j k l\`, \`w\` (next word), \`e\` (end of word), \`$\` (end of line), \`%\` (matching bracket), etc.
- \`V\` (capital) — **line-wise** selection. Move up/down to grab whole lines.
- \`Ctrl-v\` — **block** selection. A rectangle — great for editing columns.

Once you've highlighted something, the usual operators work on the selection instead of a motion:

- \`d\` — delete the selection
- \`y\` — yank (copy) it
- \`c\` — delete it *and* drop into Insert mode (change)
- \`~\` — toggle the case of every selected character
- \`>\` / \`<\` — indent / un-indent (handy for code)

\`Esc\` cancels without doing anything.

After a yank or delete, \`p\` in Normal mode pastes whatever's on the clipboard at the cursor — same as before.`,
        example: `Say you've got this line and want to capitalise the company name:

\`\`\`
goodTaste delivers maize flour weekly.
\`\`\`

Land the cursor on the \`g\`, then:
1. \`v\` — start a character-wise selection.
2. \`e\` — extend to the end of \`goodTaste\`.
3. \`c\` — change. The selection vanishes and you're in Insert mode.
4. Type \`Good Taste\`, then \`Esc\`.

Result: \`Good Taste delivers maize flour weekly.\`

To delete a whole line with visual mode instead of \`dd\`:

1. \`V\` (capital) — line-wise selection, the current line lights up.
2. (Optionally move \`j\`/\`k\` to grab more lines.)
3. \`d\` — gone.`,
        taskPrompt: `A \`suppliers.txt\` file is open for editing (run \`vi suppliers.txt\` to open it). Use **visual mode** for both edits — no \`:%s\` shortcuts.

1. On line 2 the word \`goodTaste\` should be \`Good Taste\`. Use \`v\` + \`e\` + \`c\` to change it (or similar).
2. There's a line that begins with \`TODO:\` — use \`V\` to select the whole line, then \`d\` to delete it.

Save and quit with \`:wq\`. The file should end up with 3 lines, no \`TODO:\` line, and \`Good Taste\` (capitalised, with a space) on line 2.`,
        setupCommands: [
          "printf '%s\\n' 'Rwandan suppliers list:' 'goodTaste in Kigali sells flour.' 'TODO: verify before pushing to StockTrace' 'Fair Food in Musanze sells maize.' > suppliers.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < suppliers.txt | tr -d ' '",
            expected_output: "3",
            description:
              "suppliers.txt has exactly 3 lines (TODO line removed)",
          },
          {
            check_command: "grep -c 'Good Taste' suppliers.txt | tr -d ' '",
            expected_output: "1",
            description: "Line 2 now reads 'Good Taste' (capitalised, spaced)",
          },
          {
            check_command: "grep -c '^TODO:' suppliers.txt | tr -d ' '",
            expected_output: "0",
            description: "The TODO line is gone",
          },
        ],
      },
      {
        id: "vi_2_backward_search",
        order: 2,
        title: "Backward Search with `?`",
        explanation: `You already know \`/pattern\` searches **forward** through the file. Its mirror is \`?pattern\` which searches **backward**.

Both share \`n\` and \`N\`:

- \`n\` — next match in the **same** direction as the original search.
- \`N\` — next match in the **opposite** direction.

So if you searched with \`?\`, then \`n\` keeps going backward and \`N\` flips forward.

Two more shortcuts that come up constantly:

- \`*\` — search **forward** for the word currently under the cursor (no typing needed).
- \`#\` — search **backward** for the word under the cursor.

When is \`?\` actually better than \`/\`? When the thing you want is **above** your cursor. Common case: you're at the bottom of a log file looking for the *last* \`FAILED\` line — \`?FAILED<Enter>\` jumps straight there. With \`/\` you'd either have to wrap around the file or hit \`n\` past every earlier match.`,
        example: `Open a log, jump to the end, search backwards:

\`\`\`
vi procurement.log
G                  " jump to the last line
?FAILED<Enter>     " cursor jumps UP to the most recent FAILED entry
n                  " keep going further back through earlier FAILED entries
N                  " reverse — go forward again
\`\`\`

Tip: in last-line mode, your search history is shared between \`/\` and \`?\`. Press \`/\` and then \`Up Arrow\` to recall previous patterns regardless of which direction you used.`,
        taskPrompt: `A long log file \`procurement.log\` is sitting in the sandbox. Open it with \`vi procurement.log\`.

The cursor lands at the bottom (or jump there yourself with \`G\`). There are several lines starting with \`FAILED\`. Your task:

1. Use **backward search** (\`?FAILED\`) to jump to the FAILED line closest to the bottom of the file.
2. Delete just that one line with \`dd\`.
3. Save and quit with \`:wq\`.

Don't touch the other FAILED lines — there should still be three of them left when you're done.`,
        setupCommands: [
          "printf '%s\\n' 'OK supplier=A' 'OK supplier=B' 'FAILED supplier=C' 'OK supplier=D' 'FAILED supplier=E' 'OK supplier=F' 'FAILED supplier=G' 'OK supplier=H' 'FAILED supplier=I' 'OK supplier=J' > procurement.log",
        ],
        successCriteria: [
          {
            check_command: "wc -l < procurement.log | tr -d ' '",
            expected_output: "9",
            description: "procurement.log lost exactly one line",
          },
          {
            check_command: "grep -c '^FAILED' procurement.log | tr -d ' '",
            expected_output: "3",
            description: "three FAILED lines remain (down from four)",
          },
          {
            check_command:
              "grep -c '^FAILED supplier=I' procurement.log | tr -d ' '",
            expected_output: "0",
            description:
              "the last FAILED entry (supplier=I) is the one that got removed",
          },
        ],
      },
      {
        id: "vi_3_command_mode",
        order: 3,
        title: "Last-Line (Command) Mode",
        explanation: `When you press \`:\` in Normal mode the cursor jumps to the very bottom of the screen and you can type a **command by name**. This is *last-line mode* — older books call it *ex mode* or *command mode*. Same thing.

You already use it for \`:w\`, \`:q\`, \`:wq\`, \`:q!\`, and \`:%s/old/new/g\`. Here are the ones worth knowing next:

- \`:set number\` — show line numbers in the gutter. \`:set nonumber\` to turn off.
- \`:e <filename>\` — open another file in the same vim session (\`Tab\` completes filenames).
- \`:r <filename>\` — **read** another file's contents into the current buffer at the cursor.
- \`:r !<command>\` — run a shell command and insert its **output** at the cursor. Cracking useful.
- \`:!<command>\` — run a shell command and show its output, without inserting anything.
- \`:help <topic>\` — open the built-in help. \`:q\` closes the help window.

A few quality-of-life points:

- Tab-completion works for filenames and commands (\`:e su<Tab>\` cycles through matches).
- The \`Up Arrow\` recalls previous commands — your command history is persistent.
- Many commands take a **range**: \`:5,10d\` deletes lines 5 through 10. \`:%\` means the whole file (that's what the \`%\` in \`:%s/.../...\` is).`,
        example: `Inserting today's date as a new line, without leaving vim:

\`\`\`
G                 " jump to the bottom
o                 " open a new line below in Insert mode
<Esc>             " back to Normal
:r !date<Enter>   " insert the output of \`date\` right where the cursor is
\`\`\`

Or peeking at another file without opening it:

\`\`\`
:!cat /etc/hostname    " runs the command, shows the output, returns you to vim
\`\`\`

Or pulling a list of files into the document you're editing:

\`\`\`
:r !ls -1 inventory/   " inserts each filename on its own line
\`\`\``,
        taskPrompt: `A file \`report.txt\` exists with a single header line. An \`inventory/\` directory next to it contains three CSV files.

Your task — using **last-line mode**, no other tools:

1. Open the file: \`vi report.txt\`.
2. Move the cursor to the end of the file (\`G\` then \`$\`, or just \`G\`).
3. Run \`:r !ls -1 inventory/\` to insert the list of inventory files **below** the header. (The \`-1\` forces one filename per line.)
4. Save and quit with \`:wq\`.

When you're done, \`report.txt\` should have the original header on line 1 and the three CSV filenames on lines 2, 3, 4.`,
        setupCommands: [
          "rm -rf inventory report.txt",
          "mkdir -p inventory",
          "touch inventory/beans.csv inventory/flour.csv inventory/maize.csv",
          "printf '%s\\n' 'StockTrace inventory listing:' > report.txt",
        ],
        successCriteria: [
          {
            check_command: "wc -l < report.txt | tr -d ' '",
            expected_output: "4",
            description: "report.txt has 4 lines (header + 3 filenames)",
          },
          {
            check_command: "head -1 report.txt",
            expected_output: "StockTrace inventory listing:",
            description: "the header is still on line 1",
          },
          {
            check_command:
              "grep -c '\\.csv$' report.txt | tr -d ' '",
            expected_output: "3",
            description: "three .csv filenames were inserted from inventory/",
          },
        ],
      },
    ],
  },
];
