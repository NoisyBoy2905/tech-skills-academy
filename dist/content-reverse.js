// Skill subjects that aren't certs or career tracks. Reverse engineering: beginner path.
// Shape: lesson = {id,title,intro,ideas[],example,questions:[{text,options[],correct(index),why}]}
const skillSubjects = [
 {
  id:"reverse-engineering", kind:"Skill", name:"Reverse engineering",
  blurb:"Work out what a program does without seeing its source code. Starts from zero.",
  sections:[{
   name:"Beginner path",
   summary:"Free tools only: Ghidra, a debugger and a safe virtual machine.",
   lessons:[
    {id:"what-is-re", title:"What reverse engineering is",
     intro:"You take a finished program and work out how it behaves, without the original code.",
     ideas:[
      "People do this to understand malware, find security bugs, check that software does what it claims, and solve puzzle programs called crackmes.",
      "Stay on the right side of the line. Practise on your own programs, on crackmes and on capture-the-flag (CTF) challenges that are made for it. Cracking paid software or breaking a licence agreement can be illegal.",
      "If you ever look at real malware, do it inside a virtual machine (VM) with no network and no shared folders, so nothing can escape onto your own computer."
     ],
     example:"Sites like crackmes.one and picoCTF have small programs made to be reverse engineered. The goal is usually to find the hidden password or the code that checks it.",
     questions:[
      {text:"Which is a safe and legal place to practise?", options:["A crackme made for practice","The latest paid game, to remove its licence check","A bank's login app, to see how it works","A coworker's work laptop"], correct:0, why:"Crackmes and CTF challenges are built to be taken apart. The others involve software or devices you don't have permission to attack."},
      {text:"Why analyse suspicious files inside a virtual machine?", options:["It makes the file run faster","If it is harmful, it stays trapped away from your real computer","Virtual machines hide your name from websites","It removes the need for any tools"], correct:1, why:"A VM is a separate pretend computer. Harm done inside it can be thrown away."}
     ]},
    {id:"files", title:"From code to a program file",
     intro:"To read a program backwards, you first need to know how it was made forwards.",
     ideas:[
      "A programmer writes source code. A compiler turns it into machine code, which is raw instructions for the CPU. The finished program is saved as a file.",
      "Compiling throws things away: comments are gone, and variable and function names are usually gone too. That is why reverse engineering feels like solving a puzzle.",
      "The file has a standard layout so the operating system can run it. Windows programs use the PE format (.exe, .dll). Linux programs use ELF. The layout tells you where the code and the data sit."
     ],
     example:"You write a function called checkPassword. After compiling, the file may just call it FUN_00401136. You work out its purpose from what it does, then give it a name yourself.",
     questions:[
      {text:"What usually disappears when source code is compiled?", options:["The instructions","Comments and the programmer's variable names","The whole program's behaviour","The file's size"], correct:1, why:"The behaviour must stay. Comments and names are only there for humans, so they are usually dropped."},
      {text:"A Windows .exe file is stored in which format?", options:["ELF","PDF","PE","ZIP"], correct:2, why:"PE (Portable Executable) is the Windows format. ELF is the Linux one."}
     ]},
    {id:"static", title:"A first look without running it",
     intro:"Studying a file without running it is called static analysis. It is always the safest first step.",
     ideas:[
      "Start with the basics: what kind of file is it? On Linux, the file command tells you. The strings command pulls out readable text such as messages, file names and web addresses.",
      "Readable text is a gold mine. A message like \"Wrong password\" tells you which part of the code is checking a password.",
      "The imports list shows which system functions a program asks for, such as opening files or using the network. That hints at what it can do."
     ],
     example:"Running strings on a crackme shows \"Enter the key:\" and \"Access granted\". You now know what to search for inside the code.",
     questions:[
      {text:"What does static analysis mean?", options:["Studying a file without running it","Running it as fast as possible","Deleting the file","Only looking at its icon"], correct:0, why:"Static means not running. You examine the file as it sits on disk."},
      {text:"You see the text \"Access denied\" in a program. What is the most useful next step?", options:["Ignore it, text is never helpful","Find the code that uses that message, because the check is probably nearby","Delete the program","Rename the file"], correct:1, why:"Programs print messages right after they make a decision, so the code that uses the text is a good place to start."}
     ]},
    {id:"cpu", title:"How the CPU sees a program",
     intro:"Machine code only makes sense once you know the three things the CPU works with.",
     ideas:[
      "Registers are tiny, very fast storage boxes inside the CPU. On 64-bit machines they have names like rax, rbx and rcx. Instructions mostly move data between them and do sums on them.",
      "Memory holds the program and its data. The stack is a part of memory used like a pile of plates: the last thing put on is the first thing taken off. Functions use it to store their local variables and to remember where to return to.",
      "Two registers are special. rsp points to the top of the stack. rip points to the next instruction to run."
     ],
     example:"When one function calls another, the CPU puts the return address on the stack. When the second function finishes, it picks that address back up and carries on where the first left off.",
     questions:[
      {text:"Which register holds the address of the next instruction to run?", options:["rsp","rip","rax","rcx"], correct:1, why:"rip is the instruction pointer. rsp is the stack pointer."},
      {text:"The stack works like a pile of plates. What does that mean?", options:["Everything is stored in alphabetical order","The last item added is the first item removed","It can hold only one item","It is stored inside the file on disk"], correct:1, why:"That is called last in, first out. It is why functions can return in the right order."}
     ]},
    {id:"assembly", title:"Reading assembly",
     intro:"Assembly is machine code written in readable short words. You only need a handful to start.",
     ideas:[
      "mov copies a value, so mov eax, 5 puts 5 into eax. add and sub do sums. call runs another function and ret comes back from one.",
      "An if statement becomes two steps. cmp compares two values. Then a jump instruction either jumps or carries on: je jumps if they were equal and jne jumps if they were not.",
      "So a password check often looks like: compare the answer, jump to the fail message if it is wrong, otherwise carry on to the success message. Spotting this pattern is the core skill."
     ],
     example:"cmp eax, 5 followed by jne fail means: if eax is not 5, go to the code labelled fail. That means the program wants eax to be 5.",
     questions:[
      {text:"What does mov eax, 5 do?", options:["Compares eax with 5","Puts the number 5 into eax","Jumps to address 5","Ends the program"], correct:1, why:"mov copies a value into a place. Here the place is the register eax."},
      {text:"After cmp eax, 5, the instruction je success appears. When does the program jump to success?", options:["When eax is not 5","Always","When eax equals 5","Never"], correct:2, why:"je means jump if equal, so it jumps when eax equals 5."}
     ]},
    {id:"ghidra", title:"Ghidra and the decompiler",
     intro:"Ghidra is a free tool that opens a program and shows you its code in a readable way.",
     ideas:[
      "Ghidra is free and open source. It shows the assembly, and its decompiler also turns that into C-like code that is much easier to read.",
      "The decompiler is a clever guess, not a perfect copy. When something looks odd, check the assembly beside it.",
      "A good workflow: find an interesting string, use cross-references to see which code uses it, then read that function. Rename things as you learn what they do, such as changing FUN_00401136 to check_password."
     ],
     example:"You search for \"Access granted\", jump to the code that uses it, and see an if statement comparing your input to a stored value. That value is the password.",
     questions:[
      {text:"What does Ghidra's decompiler do?", options:["Runs the program faster","Turns assembly into C-like code that is easier to read","Removes viruses","Writes the original source code back exactly"], correct:1, why:"It produces a readable approximation. The original names and comments are gone for good."},
      {text:"What is a good way to find the important code in an unknown program?", options:["Start reading at the very first byte and never skip","Find an interesting string and follow where it is used","Delete the functions you don't like","Guess a password at random"], correct:1, why:"Strings point straight at what the program cares about. Cross-references show you the code that uses them."}
     ]},
    {id:"debugger", title:"Running it step by step",
     intro:"Dynamic analysis means running the program under a debugger, so you can pause it and look inside.",
     ideas:[
      "A debugger runs the program but lets you stop it. A breakpoint is a marker that pauses the program when it reaches that line. Then you can step one instruction at a time.",
      "While paused you can see the registers and memory. That lets you check your guesses from reading the code, for example what value is really being compared.",
      "Common free debuggers are x64dbg on Windows and gdb on Linux. Only run unknown programs inside a VM."
     ],
     example:"You set a breakpoint on the cmp instruction in a crackme. When you type a password, the program pauses and you read the register to see what it was compared against.",
     questions:[
      {text:"What is a breakpoint?", options:["A bug in the program","A marker that pauses the program at a chosen point","A broken file","A kind of virus"], correct:1, why:"It tells the debugger to stop there so you can look around."},
      {text:"Why use a debugger after reading the code?", options:["To check what values really appear while it runs","To make the file smaller","To remove the need for a VM","To rename functions automatically"], correct:0, why:"Reading shows what could happen. Running shows what does happen."}
     ]}
   ]
  }]
 }
];
