import { useMemo } from "react";
import { createTheme } from '@mui/material/styles';
import { useTheme } from "../../context/ThemeContext";

const useMuiTheme = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#465FFF', 
          },
          secondary: {
            main: '#667085',
          },
          background: {
            default: isDarkMode ? '#1a2231' : '#f9fafb', 
            paper: isDarkMode ? '#1D2939' : '#ffffff', 
          },
          text: {
            primary: isDarkMode ? '#ffffff' : '#101828', 
            secondary: isDarkMode ? '#98A2B3' : '#667085', 
          },
          error: {
            main: '#F04438',
          },
          success: {
            main: '#12B76A', 
          },
          warning: {
            main: '#F79009', 
          },
        },
        typography: {
          fontFamily: 'Outfit, sans-serif',
          fontSize: 14,
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                boxShadow: '0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
                borderRadius: '12px',
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: `1px solid ${isDarkMode ? '#344054' : '#E4E7EC'}`,
                padding: '16px',
                fontSize: '14px',
              },
              head: {
                fontWeight: 600,
                backgroundColor: isDarkMode ? '#1D2939' : '#F9FAFB',
                color: isDarkMode ? '#98A2B3' : '#667085',
                textTransform: 'uppercase',
                fontSize: '12px',
                letterSpacing: '0.05em',
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                '& .MuiTableCell-root': {
                  backgroundColor: isDarkMode ? '#1D2939' : '#F9FAFB',
                },
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                color: isDarkMode ? '#98A2B3' : '#667085',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F2F4F7',
                },
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                backgroundColor: isDarkMode ? '#1D2939' : '#ffffff',
                borderRadius: '8px',
                '&.Mui-focused': {
                  boxShadow: '0px 0px 0px 4px rgba(70, 95, 255, 0.12)', // Your shadow-focus-ring
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              notchedOutline: {
                borderColor: isDarkMode ? '#344054' : '#D0D5DD',
              },
            },
          },
        },
      }),
    [isDarkMode],
  );
  return muiTheme;
}
    export default useMuiTheme;