'use client'

import { useState, FC, useEffect } from 'react'

// Types
type ButtonValue = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | '.' | 'C' | '±' | '%' | '÷' | '×' | '-' | '+' | '='
  | 'sin' | 'cos' | 'tan' | '√' | 'log' | 'ln' | 'π' | '^' | '(' | ')' | '!' | 'e'
  | '⌫'

interface CalculatorState {
  currentValue: string
  previousValue: string
  operation: string
  overwrite: boolean
  fullExpression: string
}

// Helper functions
const factorial = (n: number): number => {
  if (n < 0) return NaN
  if (n === 0 || n === 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

const performCalculation = (firstOperand: number, secondOperand: number, operation: string): number => {
  switch (operation) {
    case '+':
      return firstOperand + secondOperand
    case '-':
      return firstOperand - secondOperand
    case '×':
      return firstOperand * secondOperand
    case '÷':
      if (secondOperand === 0) {
        throw new Error('Division by zero')
      }
      return firstOperand / secondOperand
    case '^':
      return Math.pow(firstOperand, secondOperand)
    default:
      return secondOperand
  }
}

const formatNumber = (num: number): string => {
  // Format number to be more readable
  const str = num.toString()
  if (str.length > 12) {
    return num.toExponential(8)
  }
  // Remove trailing zeros after decimal
  if (str.includes('.')) {
    return parseFloat(str).toString()
  }
  return str
}

const calculate = (
  state: CalculatorState,
  buttonValue: ButtonValue
): CalculatorState => {
  // Handle number input
  if (!isNaN(Number(buttonValue))) {
    if (state.overwrite) {
      const newExpression = state.fullExpression.endsWith('=') ? buttonValue : `${state.fullExpression}${buttonValue}`
      return {
        ...state,
        currentValue: buttonValue,
        overwrite: false,
        fullExpression: newExpression
      }
    }
    const newCurrentValue = state.currentValue === '0' ? buttonValue : state.currentValue + buttonValue
    const newFullExpression = state.fullExpression.endsWith('=') ? buttonValue : state.fullExpression + buttonValue
    return {
      ...state,
      currentValue: newCurrentValue,
      fullExpression: newFullExpression
    }
  }

  // Handle other operations
  switch (buttonValue) {
    case '⌫':
      if (state.overwrite) return state
      if (state.currentValue.length === 1) {
        return {
          ...state,
          currentValue: '0',
          overwrite: true,
          fullExpression: state.fullExpression.slice(0, -1) || '0'
        }
      }
      return {
        ...state,
        currentValue: state.currentValue.slice(0, -1),
        fullExpression: state.fullExpression.slice(0, -1)
      }
    case 'C':
      return { 
        currentValue: '0', 
        previousValue: '', 
        operation: '', 
        overwrite: true,
        fullExpression: ''
      }
    case '±':
      const negatedValue = String(-parseFloat(state.currentValue))
      const lastNumIndex = state.fullExpression.search(/[0-9\.]+$/)
      let newExpression = state.fullExpression
      if (lastNumIndex !== -1) {
        newExpression = state.fullExpression.substring(0, lastNumIndex) + negatedValue
      }
      return {
        ...state,
        currentValue: negatedValue,
        fullExpression: newExpression
      }
    case '%':
      const percentValue = String(parseFloat(state.currentValue) / 100)
      const lastNumIndexPercent = state.fullExpression.search(/[0-9\.]+$/)
      let newExpressionPercent = state.fullExpression
      if (lastNumIndexPercent !== -1) {
        newExpressionPercent = state.fullExpression.substring(0, lastNumIndexPercent) + percentValue
      }
      return {
        ...state,
        currentValue: percentValue,
        fullExpression: newExpressionPercent
      }
    case '.':
      if (state.overwrite) {
        return {
          ...state,
          currentValue: '0.',
          overwrite: false,
          fullExpression: state.fullExpression.endsWith('=') ? '0.' : state.fullExpression + '0.'
        }
      }
      if (state.currentValue.includes('.')) {
        return state
      }
      return {
        ...state,
        currentValue: state.currentValue + '.',
        fullExpression: state.fullExpression + '.'
      }
    case '=':
      if (!state.operation || !state.previousValue) return state

      try {
        const result = performCalculation(
          parseFloat(state.previousValue),
          parseFloat(state.currentValue),
          state.operation
        )
        const formattedResult = formatNumber(result)
        const fullExpression = `${state.previousValue} ${state.operation} ${state.currentValue} = ${formattedResult}`
        
        return {
          currentValue: formattedResult,
          previousValue: '',
          operation: '',
          overwrite: true,
          fullExpression: fullExpression
        }
      } catch (error) {
        return {
          ...state,
          currentValue: 'Error',
          overwrite: true,
          fullExpression: state.fullExpression + ' = Error'
        }
      }
    case '÷':
    case '×':
    case '-':
    case '+':
    case '^':
      if (state.previousValue && state.operation && !state.overwrite) {
        try {
          const result = performCalculation(
            parseFloat(state.previousValue),
            parseFloat(state.currentValue),
            state.operation
          )
          const formattedResult = formatNumber(result)
          const fullExpression = `${state.previousValue} ${state.operation} ${state.currentValue} = ${formattedResult}`
          
          return {
            currentValue: formattedResult,
            previousValue: formattedResult,
            operation: buttonValue,
            overwrite: true,
            fullExpression: fullExpression
          }
        } catch (error) {
          return {
            ...state,
            currentValue: 'Error',
            overwrite: true,
            fullExpression: state.fullExpression + ' = Error'
          }
        }
      }
      return {
        ...state,
        previousValue: state.currentValue,
        operation: buttonValue,
        overwrite: true,
        fullExpression: state.fullExpression + (state.fullExpression === '' || state.overwrite ? '' : ' ') + buttonValue + ' '
      }
    case 'sin':
    case 'cos':
    case 'tan':
      const trigFunc = buttonValue
      const trigValue = parseFloat(state.currentValue)
      let trigResult: number
      switch (trigFunc) {
        case 'sin': trigResult = Math.sin(trigValue); break
        case 'cos': trigResult = Math.cos(trigValue); break
        case 'tan': trigResult = Math.tan(trigValue); break
        default: trigResult = trigValue
      }
      const formattedTrigResult = formatNumber(trigResult)
      return {
        ...state,
        currentValue: formattedTrigResult,
        overwrite: true,
        fullExpression: `${trigFunc}(${state.currentValue}) = ${formattedTrigResult}`
      }
    case '√':
      const sqrtValue = parseFloat(state.currentValue)
      if (sqrtValue < 0) {
        return {
          ...state,
          currentValue: 'Error',
          overwrite: true,
          fullExpression: `√(${state.currentValue}) = Error`
        }
      }
      const sqrtResult = formatNumber(Math.sqrt(sqrtValue))
      return {
        ...state,
        currentValue: sqrtResult,
        overwrite: true,
        fullExpression: `√(${state.currentValue}) = ${sqrtResult}`
      }
    case 'log':
      const logValue = parseFloat(state.currentValue)
      if (logValue <= 0) {
        return {
          ...state,
          currentValue: 'Error',
          overwrite: true,
          fullExpression: `log(${state.currentValue}) = Error`
        }
      }
      const logResult = formatNumber(Math.log10(logValue))
      return {
        ...state,
        currentValue: logResult,
        overwrite: true,
        fullExpression: `log(${state.currentValue}) = ${logResult}`
      }
    case 'ln':
      const lnValue = parseFloat(state.currentValue)
      if (lnValue <= 0) {
        return {
          ...state,
          currentValue: 'Error',
          overwrite: true,
          fullExpression: `ln(${state.currentValue}) = Error`
        }
      }
      const lnResult = formatNumber(Math.log(lnValue))
      return {
        ...state,
        currentValue: lnResult,
        overwrite: true,
        fullExpression: `ln(${state.currentValue}) = ${lnResult}`
      }
    case 'π':
      const piValue = Math.PI.toString()
      return {
        ...state,
        currentValue: state.overwrite ? piValue : state.currentValue + piValue,
        overwrite: false,
        fullExpression: state.overwrite ? piValue : state.fullExpression + piValue
      }
    case 'e':
      const eValue = Math.E.toString()
      return {
        ...state,
        currentValue: state.overwrite ? eValue : state.currentValue + eValue,
        overwrite: false,
        fullExpression: state.overwrite ? eValue : state.fullExpression + eValue
      }
    case '!':
      const factValue = parseInt(state.currentValue)
      const factResult = factorial(factValue)
      if (isNaN(factResult)) {
        return {
          ...state,
          currentValue: 'Error',
          overwrite: true,
          fullExpression: `${state.currentValue}! = Error`
        }
      }
      const formattedFactResult = formatNumber(factResult)
      return {
        ...state,
        currentValue: formattedFactResult,
        overwrite: true,
        fullExpression: `${state.currentValue}! = ${formattedFactResult}`
      }
    case '(':
    case ')':
      return {
        ...state,
        currentValue: state.overwrite ? buttonValue : state.currentValue + buttonValue,
        overwrite: false,
        fullExpression: state.overwrite ? buttonValue : state.fullExpression + buttonValue
      }
    default:
      return state
  }
}

// Button Component
interface ButtonProps {
  value: ButtonValue
  onClick: (value: ButtonValue) => void
  className?: string
}

const Button: FC<ButtonProps> = ({ value, onClick, className }) => {
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        h-10 sm:h-12 md:h-14 text-sm sm:text-base md:text-lg font-medium rounded-md 
        transition-all duration-150 active:scale-95 focus:outline-none 
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${className}
      `}
    >
      {value}
    </button>
  )
}

// Display Component
interface DisplayProps {
  fullExpression: string
  currentValue: string
}

const Display: FC<DisplayProps> = ({ fullExpression, currentValue }) => {
  // Split the expression to show part in smaller text if needed
  const lastEqualIndex = fullExpression.lastIndexOf('=')
  let expressionPart = fullExpression
  let resultPart = ''
  
  if (lastEqualIndex !== -1) {
    expressionPart = fullExpression.substring(0, lastEqualIndex + 1).trim()
    resultPart = fullExpression.substring(lastEqualIndex + 1).trim()
  }

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-800 to-gray-900 text-right rounded-t-lg min-h-[120px] flex flex-col justify-end">
      {/* Full expression display - smaller font for longer expressions */}
      <div className="text-gray-300 text-xs sm:text-sm md:text-base font-mono mb-2 overflow-x-auto whitespace-nowrap scrollbar-thin max-h-[40px]">
        {expressionPart || ' '}
      </div>
      
      {/* Current value/result display */}
      <div className="text-white text-2xl sm:text-3xl md:text-4xl font-mono overflow-x-auto whitespace-nowrap scrollbar-thin">
        {resultPart || currentValue}
      </div>
    </div>
  )
}

// Main Calculator Component
export default function Calculator() {
  const [state, setState] = useState<CalculatorState>({
    currentValue: '0',
    previousValue: '',
    operation: '',
    overwrite: true,
    fullExpression: ''
  })

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      
      // Map keyboard keys to calculator buttons
      const keyMap: { [key: string]: ButtonValue } = {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
        '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
        '.': '.', '+': '+', '-': '-', '*': '×', '/': '÷',
        'Enter': '=', '=': '=', 'Escape': 'C', 'Delete': 'C',
        'Backspace': '⌫', '%': '%', '(': '(', ')': ')',
        '^': '^'
      }

      if (key in keyMap) {
        e.preventDefault()
        handleButtonClick(keyMap[key])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleButtonClick = (value: ButtonValue) => {
    setState(prev => calculate(prev, value))
  }

  const buttons: ButtonValue[][] = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['⌫', '0', '.', '='],
    ['sin', 'cos', 'tan', '√'],
    ['log', 'ln', 'π', '^'],
    ['(', ')', '!', 'e'],
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        {/* <div className="mb-4 sm:mb-6 md:mb-8 text-center px-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Scientific Calculator</h1>
        </div> */}
        
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl overflow-hidden border border-gray-200">
          <Display fullExpression={state.fullExpression} currentValue={state.currentValue} />
          
          <div className="grid grid-cols-4 gap-1 sm:gap-2 p-2 sm:p-3 md:p-4 bg-gray-50">
            {buttons.flat().map((btn, i) => {
              // Determine button styling based on type
              let btnClass = ''
              
              if (btn === '=') {
                btnClass = 'col-span-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm'
              } else if (['÷', '×', '-', '+', '='].includes(btn)) {
                btnClass = 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-sm'
              } else if (['C', '±', '%'].includes(btn)) {
                btnClass = 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 hover:from-gray-400 hover:to-gray-500 shadow-sm'
              } else if (['sin', 'cos', 'tan', '√', 'log', 'ln', 'π', '^', '(', ')', '!', 'e'].includes(btn)) {
                btnClass = 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 hover:from-purple-200 hover:to-purple-300 shadow-sm text-xs sm:text-sm'
              } else if (!isNaN(Number(btn)) || btn === '.' || btn === '⌫') {
                btnClass = 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 hover:from-gray-200 hover:to-gray-300 shadow-sm'
              }
              
              return (
                <Button
                  key={i}
                  value={btn}
                  onClick={handleButtonClick}
                  className={btnClass}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}