---
title: Chapter 3 - Interpreting Computer Programs
description: ""
date: 7-18-2026
tags:
  - Berkeley
  - cs61a
  - textbook
---
# 3.3 Exceptions
- Python uses exceptions to handle errors
- Exceptions may come from user defined Exceptions or from internal exceptions
```python
raise Exception('Exception Message')
```
- If an exception isn't handled, the program stops at that exception

- Handling Exceptions
	- A try-except statement will handle exceptions that occur within the try statement
```python
try:
	<try suite>
except Exception as e:
	<except suite>
except BaseException as a:
	<except suite>
```

- User Defined Exception Objects
	- You can add your own attributes to your own exception objects

```python
class IterImproveError(Exception):
   def __init__(self, last_guess):
       self.last_guess = last_guess
```