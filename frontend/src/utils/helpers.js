/**
 * Formats a date string into a more readable format.
 * @param {string | Date} dateInput - The date string (e.g., ISO string) or Date object.
 * @param {object} [options] - Options for toLocaleDateString, e.g., { year: 'numeric', month: 'short', day: 'numeric' }.
 * @returns {string} The formatted date string, or 'N/A' if invalid.
 */
export const formatDate = (dateInput, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) { // Check for invalid date
      return 'Invalid Date';
    }
    return date.toLocaleDateString(undefined, options);
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'N/A';
  }
};

/**
 * Gets a human-readable file size from bytes.
 * @param {number} bytes - File size in bytes.
 * @param {number} [decimals=2] - Number of decimal places.
 * @returns {string} Formatted file size string (e.g., "1.23 MB").
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Generates a simple icon/indicator based on file type.
 * For a real app, you'd use an icon library.
 * @param {string} mimeType - The MIME type of the file (e.g., "application/pdf").
 * @returns {string} A string representing a simple icon.
 */
export const getFileIcon = (mimeType) => {
  if (mimeType.includes('pdf')) {
    return '📄 PDF';
  } else if (mimeType.includes('image')) {
    return '🖼️ Image';
  } else if (mimeType.includes('text')) {
    return '📝 Text';
  }
  return '📁 File';
};

// Add more helper functions as needed, e.g.,
// export const capitalizeFirstLetter = (string) => { ... };
// export const truncateText = (text, maxLength) => { ... };