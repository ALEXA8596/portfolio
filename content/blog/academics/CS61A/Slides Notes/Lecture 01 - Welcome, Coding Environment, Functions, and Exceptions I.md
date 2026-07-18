---
title: Lecture 01 - Welcome, Coding Environment, Functions, and Exceptions I
description: ""
date: 7-18-2026
tags:
  - Berkeley
  - cs61a
  - lecture-notes
---
# Functions
- [[Primitive Data Types]]
	- [Integer](Integer%20(Int).md)
		- -3, -2, -1, 0, 1, 2, 3, etc
	- [[Float]]
		- Decimal Numbers
	- [[String]]
		- A collection of characters of any length
	- [[Boolean]]
		- A value representing True or False

- Names and Assignment 
	- Use the equals sign to bind values to names

- [[Functions]]
	- A way of saving and reusing code statements
	- A function can have inputs or parameters and return values
	- The values that are passed to the function externally are called arguments
	- Functions are called using call expressions
		- using the function's name and the arguments in parentheses
		- Interpreters first evaluate the operator
			- Operator: The function name
		- Then they evaluate the operands
			- Operands: the arguments passed in parentheses
		- Finally, the interpreter applies the operands to the operator
		- Consider using an expression tree to see what gets evaluated first.
	- print is used to display something to the user
	- return is used to replace the value of the called function with the given value
	- pure functions: only return a value
	- non-pure functions: can generate a side-effect along with a return value
		- i.e. printing or changing the value of a variable
	- "None"
		- The value that is returned when nothing is returned
		- Represents nothing

- Exceptions
	- When something goes wrong, an exception or error occurs / is raised / is thrown.
	- Types of errors
		- Syntax - When an error is caught at compile time
		- Runtime - When an error is caught at runtime
		- Logical - When no error occurs but the output is unexpected
	- Print Debugging
		- Use the print function to print the value of variables as you try to debug a runtime / logical error.
	- Assert
		- Use assert as an insanity check.
```python
assert statementThatShouldBeTrue, assertExceptionMessage;
```