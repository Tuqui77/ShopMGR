import { useState, useCallback } from 'react';

type Operation = '+' | '-' | '×' | '÷' | null;

interface CalculatorState {
  display: string;
  previousValue: number | null;
  operation: Operation;
  waitingForOperand: boolean;
  displayOperation: Operation; // Para mostrar el símbolo en el display
}

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>({
    display: '0',
    previousValue: null,
    operation: null,
    waitingForOperand: false,
    displayOperation: null,
  });

  const { display, previousValue, operation, waitingForOperand, displayOperation } = state;

  const clear = useCallback(() => {
    setState({
      display: '0',
      previousValue: null,
      operation: null,
      displayOperation: null,
      waitingForOperand: false,
    });
  }, []);

  const inputDigit = useCallback((digit: string) => {
    setState(prev => {
      if (prev.waitingForOperand) {
        return {
          ...prev,
          display: digit,
          waitingForOperand: false,
        };
      }

      return {
        ...prev,
        display: prev.display === '0' ? digit : prev.display + digit,
      };
    });
  }, []);

  const inputDecimal = useCallback(() => {
    setState(prev => {
      if (prev.waitingForOperand) {
        return {
          ...prev,
          display: '0.',
          waitingForOperand: false,
        };
      }

      if (!prev.display.includes('.')) {
        return {
          ...prev,
          display: prev.display + '.',
        };
      }

      return prev;
    });
  }, []);

  const performOperation = useCallback(() => {
    const currentValue = parseFloat(display);
    
    if (previousValue === null || operation === null) return null;

    let result: number;
    switch (operation) {
      case '+':
        result = previousValue + currentValue;
        break;
      case '-':
        result = previousValue - currentValue;
        break;
      case '×':
        result = previousValue * currentValue;
        break;
      case '÷':
        if (currentValue === 0) return null; // Division by zero
        result = previousValue / currentValue;
        break;
      default:
        return null;
    }

    // Handle floating point precision
    return Math.round(result * 100000000) / 100000000;
  }, [display, previousValue, operation]);

  const handleOperation = useCallback((nextOperation: Operation) => {
    const currentValue = parseFloat(display);

    if (previousValue === null) {
      setState(prev => ({
        ...prev,
        previousValue: currentValue,
        operation: nextOperation,
        displayOperation: nextOperation,
        waitingForOperand: true,
      }));
    } else if (operation) {
      const result = performOperation();
      if (result === null) {
        // Division by zero
        setState({
          display: 'Error',
          previousValue: null,
          operation: null,
          displayOperation: null,
          waitingForOperand: true,
        });
        return;
      }

      setState({
        display: String(result),
        previousValue: result,
        operation: nextOperation,
        displayOperation: nextOperation,
        waitingForOperand: true,
      });
    }
  }, [display, previousValue, operation, performOperation]);

  const handleEquals = useCallback(() => {
    if (previousValue === null || operation === null) return;

    const result = performOperation();
    if (result === null) {
      setState({
        display: 'Error',
        previousValue: null,
        operation: null,
        displayOperation: null,
        waitingForOperand: true,
      });
      return;
    }

    setState({
      display: String(result),
      previousValue: null,
      operation: null,
      displayOperation: null,
      waitingForOperand: true,
    });
  }, [previousValue, operation, performOperation]);

  const toggleSign = useCallback(() => {
    const currentValue = parseFloat(display);
    if (currentValue === 0) return;

    setState(prev => ({
      ...prev,
      display: String(-currentValue),
    }));
  }, [display]);

  const inputPercent = useCallback(() => {
    const currentValue = parseFloat(display);
    setState(prev => ({
      ...prev,
      display: String(currentValue / 100),
    }));
  }, [display]);

  const deleteLastDigit = useCallback(() => {
    setState(prev => {
      if (prev.display === 'Error' || prev.display === '0') return prev;
      
      const newDisplay = prev.display.slice(0, -1);
      return {
        ...prev,
        display: newDisplay === '' || newDisplay === '-' ? '0' : newDisplay,
      };
    });
  }, []);

  const getCurrentResult = useCallback((): number => {
    if (display === 'Error') return 0;
    return parseFloat(display) || 0;
  }, [display]);

  return {
    display,
    previousValue,
    operation,
    waitingForOperand,
    displayOperation,
    clear,
    inputDigit,
    inputDecimal,
    handleOperation,
    handleEquals,
    toggleSign,
    inputPercent,
    deleteLastDigit,
    getCurrentResult,
  };
}
