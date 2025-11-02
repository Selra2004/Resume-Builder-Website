// Utility functions for formatting numbers and text

/**
 * Formats a number with commas for thousands separator
 * @param value - The number or string to format
 * @returns Formatted string with commas
 */
export const formatNumberWithCommas = (value: string | number): string => {
  if (!value) return '';
  
  // Convert to string and remove existing commas
  const cleanValue = value.toString().replace(/,/g, '');
  
  // If not a valid number, return original
  if (isNaN(Number(cleanValue))) return value.toString();
  
  // Format with commas
  return Number(cleanValue).toLocaleString();
};

/**
 * Removes commas from a formatted number string
 * @param value - The formatted number string
 * @returns Clean number string without commas
 */
export const removeCommasFromNumber = (value: string): string => {
  return value.replace(/,/g, '');
};

/**
 * Handles input change with automatic comma formatting
 * @param value - The input value
 * @param callback - Function to call with the formatted value
 */
export const handleCommaFormattedInput = (
  value: string, 
  callback: (formattedValue: string) => void
) => {
  // Remove existing commas
  const cleanValue = removeCommasFromNumber(value);
  
  // Only format if it's a valid number
  if (cleanValue === '' || !isNaN(Number(cleanValue))) {
    const formattedValue = formatNumberWithCommas(cleanValue);
    callback(formattedValue);
  }
};

