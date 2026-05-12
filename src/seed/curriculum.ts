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
];
