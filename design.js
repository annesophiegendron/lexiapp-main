export const designSystem = {
  colors: {
    primary: '#007bff',
    secondary: '#ff9e99',
    backgroundLight: '#FFFFFF',
    backgroundDark: '#121212',
    textLight: '#FFFFFF',
    textDark: '#000000',
    cardBackgroundLight: '#F2F2F2',
    cardBackgroundDark: '#1e1e1e',
    border: '#ccc',
    error: '#ff4d4f',
    success: '#28a745',
    warning: '#ffc107',
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: {
      small: '12px',
      medium: '14px',
      large: '16px',
      heading: '20px',
      h1: '32px',
      h2: '24px',
      body: '14px',
      caption: '10px',
    },
    fontWeight: {
      normal: '400',
      bold: '700',
      semiBold: '600',
    },
    lineHeight: {
      normal: '1.5',
      heading: '1.3',
    },
  },
  button: {
    borderRadius: '12px',
    padding: {
      vertical: '12px',
      horizontal: '20px',
    },
    primary: {
      backgroundColor: '#007bff',
      color: '#FFFFFF',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    secondary: {
      backgroundColor: '#ff9e99',
      color: '#FFFFFF',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    disabled: {
      backgroundColor: '#ddd',
      color: '#aaa',
    },
  },
  card: {
    borderRadius: '12px',
    padding: '20px',
    margin: '10px',
    shadow: {
      small: '0px 4px 6px rgba(0, 0, 0, 0.1)',
      medium: '0px 6px 12px rgba(0, 0, 0, 0.2)',
      large: '0px 12px 24px rgba(0, 0, 0, 0.3)',
    },
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px',
  },
};
