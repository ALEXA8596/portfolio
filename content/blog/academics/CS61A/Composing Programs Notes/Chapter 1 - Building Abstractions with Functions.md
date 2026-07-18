---
title: Chapter 1 - Building Abstractions with Functions
description: ""
date: 7-18-2026
tags:
  - Berkeley
  - cs61a
  - textbook
---
# 1.1 Programming in Python
- Computer Science is extremely broad
	- Globally Distributed Systems
	- [[Artificial Intelligence]]
	- Robotics
	- Graphics
	- Security
	- Scientific Computing
	- [[Computer Architecture]]
	- New Discoveries Every Year
- Computer Science has impacted all parts of our lives
	- Entertainment
	- Communication
	- Art
	- Healthcare
- Computer Science is built on fundamental ideas
	- Begins with representing information, specifying logic on how to handle that information, and using abstractions to manage the complexity of that logic.

- Programming Languages are used to define computational processes
	- i.e. [[Python]]
		- Python is one of the largest programming languages in the world.
		- Used by web devs, scientists, game engineers.
		- Invented by Guido van Rossum in the late 1980s
		- Popular due to its readability and simplicity

- Python can be run as a file or as an interactive session

- Python can import functionalities such as fetching data from the Internet, managing files, and obtaining input from the user.

- Broadly, Computer Programs contain instructions that compute a certain value or carry out some action.
	- Statements describe actions
	- Expressions describe calculations
		- When evaluated, Python computes the value of the given expression.

- [[Functions]]
	- Functions encapsulate logic that manipulate data
	- Series of expressions and statements
	- Potentially uses arguments/parameters.

- [[Objects]]
	- Objects contain both data and logic to manipulate that data

- [[Interpreters]]
	- A program that interprets compound expressions (i.e. the code) in a predicable way

- [[Errors]]
	- Errors will be common when coding
	- Debugging: Interpreting, Diagnosing, and Solving Errors
	- Principles of Debugging:
		- Test Incrementally
		- Isolate Errors
		- Check your assumptions
		- Consult others

# 1.2 Elements of Programming
- A programming language doesn't only exist to tell the computer what to do. It also serves as a means of communication to others.
	- Ensure that your code is readable

- 3 basic features of a programming language
	- primitive expressions and statements
	- means of combination: the creation of compound elements from smaller ones
	- means of abstraction: the labeling and manipulation of compound elements

- two types of elements: functions and data
	- Data is what we want to manipulate / evaluate
	- Functions describe how to manipulate them

- Expressions
	- Numbers are primitive expressions
		- Numbers can be paired with mathematical operators to forma compound expression
		- Math expressions use [[infix]], where the operators exist in between the operands.
	- Call Expressions
		- How a function is applied to arguments
		- The operator precedes the parentheses and specifies a function
		- The operands are separated by commas within the parentheses
			- The order matters
```python
operator(operand, operand)
```

- Function Notation vs Infix
	- Function notation allows an infinite number of arguments
	- Function notation prevents ambiguity on what the operation is
	- Function notation allows nested expressions in a more straightforward manner

- Importing Libraries
```python
from libraryName import functionName, aClass, etc
```
Check out [http://docs.python.org/py3k/library/index.html](http://docs.python.org/py3k/library/index.html") for native libraries and their functions

- Naming computational objects is a critical aspect of programming languages
	- A name binds to a value
	- We establish new bindings using the assignment statement
	- The import statement also binds values
	- Assignment is the most basic form of abstraction.
		- In the same way, more complex forms of abstraction are created
	- Values are able to be assigned to names by a memory system that the interpreter manages. This is called an environment
	- Functions also have names
		- Functions can be given aliases using the assignment operator
	- Names are often called variables or variable names
	- If an assignment operator is used to give a name a new value, the old value cannot be retrieved through the same name.
```python
name = value
```
- Multiple values can be assigned to multiple names by separating the left and right sides with commas
	- The expressions on the right are collectively evaluated first before being assigned their name.

- Evaluating Nested Expressions
	- Python first evaluates the operands before passing them to the function
	- Consider drawing an expression tree, or a visualization of the hierarchical structure of nested expressions (functions and their arguments)
		- [[Trees]] in Computer Science grow from top to bottom. Objects at each point in the tree are called nodes.
		- The lower branches must first be evaluated before the root is.

- Expressions are evaluated
- Statements are executed

- Pure and Nonpure functions
	- Pure functions have some input and return some output
		- Cannot have side effects
		- Cannot change behavior over time
		- Simpler to test
			- The same inputs to a function will output the same output 
	- Nonpure functions can generate some sort of side effect
		- i.e. print displays text to the user

# 1.3 Defining New Functions
- Python implements primitive data values and functions, combining operations, and abstraction
	- Numbers and arithmetic operations are primative data values and functions
	- Nested expressions allow combining operations
	- Binding names allows abstraction

- Function definitions allow names to be bound to compound operations
	- "def" identifies functions
	- name specifies the name to bind the function to
	- compounded statements must be idented
	- the return expression isn't evaluated immediately, and is evaluated when the function is called.
```python
def <name>(<formal parameters>):
	return <return expression>
```

- Environments
	- An environment consists of a sequence of frames
	- Each frame contains bindings, associating a name to a value.
	- There is a single global frame.
	- The environment diagram shows the bindings of an environment
		- For variables, the "key" is the name and the "value" is the value
		- For functions, the "key" is the name of the function and the "value" is "func" followed by the name of the function and its parameters in parentheses.
			- The name of the function in the value is called the intrinsic name.
			- The name of the function in the key is called the bound name.
			- These two names are distinguished since aliases can be assigned.
			- A function's signature is the description of the formal parameters of the function.
	- A new frame is created inside functions
	- If there are multiple values assigned to a name, the most recently defined value is used.
	- Parameters are local to their respective functions.
		- The scope of a local name is limited to the body of the function that defines it.
		- A name is out of scope if it isn't accessible.

- Naming conventions
	- Just because the name doesn't matter to the interpreter doesn't mean you can name a variable anything you want
	- Use lowercase for functions, separating words with underscores
	- Use descriptive names
		- Name them by what the interpreter evokes or by the result
	- Use lowercase for parameters, separating words with underscores
		- Prefer one word names
		- Name the parameter by its role in the function
	- Single letter names are acceptable, but don't use l L or O.

- The most important aspect of functions is that you don't need to know its implementation in order to use it, just the relationship between the inputs and the output.
	- "black box"
	- Just like a mathematical function, consider
		- Domain: The set of inputs a function can take
		- Range: The set of values it can return
		- Intent: The relationship it computes between the domain and the range, and any side effects

- Math Operators
	- You can use infix, or you can use call expressions
	- Math Infix Operators use normal mathematical precedence
	- "/" is regular division
	- "//" is floor division


# 1.4 Designing Functions
- Functions should have one job
- Repeated code should be turned into a function abstraction
- Functions should be defined generally

- Docstrings are a triple quoted string inside a function that describes the function's inputs, output, and functionality

- Use the hashtag (#) for comments

- Inside the function definition, use an equal sign after an argument to set its default value.