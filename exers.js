function calculate(str) {
  const nums = str.split(" "); 
  let finalResult;
  if (nums.length > 3) {
    throw new Error('There is trouble, too many arguments');
  }
  if (nums.length < 3) {
    throw new Error("Not enough arguments");
  }
  const [num1, operator, num2] = nums;

  const romanNums = new Map(Object.entries({
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10, "XX": 20, "XXX": 30, "XL": 40, "L": 50, "LX": 60, "LXX": 70, "LXXX": 80, "XC": 90, "C": 100
  }));
  const operators = {"+": "toAdd", "-": "toSubstr", "*": "toMult", "/": "toDiv"}; 
  const operations = {
    toAdd(a, b) { return String(Math.trunc(a + b))},
    toSubstr(a, b) {return String(Math.trunc(a - b))},
    toMult(a, b) {return String(Math.trunc(a * b))},
    toDiv(a, b) {return String(Math.trunc(a / b))}
  }

  function romanToArab(num) {
    const numArr = num.split("");
    let arabNum = 0;
    for (let i = 0; i < numArr.length; i++ ) {
      if (+numArr[i] < numArr[i + 1]) {
        arabNum -= +romanNums.get(numArr[i]);
      } else {
        arabNum += +romanNums.get(numArr[i]);
      }    
    }  
    return arabNum;
  }
  function arabToRoman(num) {
    let romanNum = ""
    if (+num === 0) {
      romanNum = " ";
    }    
    const arabNums = String(num).split("");
    if (arabNums.length === 3) {
      romanNum = "C";  
    } else if (arabNums.length === 2) {    
      romanNums.forEach((key, value) => {
        if (key === +arabNums[0] * 10) {
            romanNum += value;
          }
        })
      romanNums.forEach((key, value) => {
        if (key === +arabNums[1]) {
            romanNum += value;
          }
        })      
    } else if (arabNums.length === 1) {
        romanNums.forEach((key, value) => {
          if (key === +num) {
            romanNum = value;
          }
        });
    }  
    return romanNum;
  }
  if (Number.isFinite(+num1) && Number.isFinite(+num2) && operators[operator]) {
    if (+num1 !== 0 && +num2 !== 0 && +num1 < 11 && +num2 < 11) {
      return finalResult = String(operations[operators[operator]](+num1, +num2));
    }
  }
  if (romanNums.has(num1) && romanNums.has(num2) && operators[operator]) {    
      const numResult = operations[operators[operator]](+romanNums.get(num1), +romanNums.get(num2));      
      finalResult = numResult <= 0 ? "" : arabToRoman(numResult);
      return finalResult;
    }  
    throw new Error('Arguments conflict with each other');  
}