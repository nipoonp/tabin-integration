const taxRate = 0.15;

const convertDollarsToCentsReturnInt = (price) => parseInt((price * 100).toFixed(0), 10);

const convertCentsToDollarsReturnFloat = (price) => parseFloat((price / 100).toFixed(2));

const calculateTaxAmount = (total) => {
  const diff = total / (1 + taxRate);
  return total - diff;
};

export {
  taxRate, convertDollarsToCentsReturnInt, convertCentsToDollarsReturnFloat, calculateTaxAmount,
};
