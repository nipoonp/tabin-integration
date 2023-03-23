export const taxRate = 0.15;

export const convertDollarsToCentsReturnInt = (price: number) => parseInt((price * 100).toFixed(0));

export const convertCentsToDollarsReturnFloat = (price: number) => parseFloat((price / 100).toFixed(2));

export const calculateTaxAmount = (total: number) => {
    const diff = total / (1 + taxRate);
    return total - diff;
};
