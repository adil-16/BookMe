import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// @mui
import { Link, Stack, IconButton, InputAdornment, TextField, Checkbox, Alert } from '@mui/material';
import { LoadingButton } from '@mui/lab';
// components
import Iconify from '../../../components/iconify';

//Firebase
import { auth } from '../../../firebase';
import { useAuth } from '../../../Context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

// ----------------------------------------------------------------------

export default function LoginForm() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const { login, logout } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [User, setUser] = useState({});

  const [loginError, setloginError] = useState('');
  const [isProcessing, setisProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);
  const doLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setloginError('Please Enter Both Email and Pasword.');
      return;
    }
    setisProcessing(true);
    try {
      // setloginError();

      await login(loginEmail, loginPassword);

      auth.currentUser
        .getIdTokenResult()
        .then((idTokenResult) => {
          setisProcessing(false);
          console.log('Id token result si : ', idTokenResult);
          // Confirm the user is an Admin.
          if (!!idTokenResult.claims.admin) {
            navigate('/Dashboard/');
          } else {
            logout();
            setloginError('Only Admin Can Login Here');
          }
        })
        .catch((error) => {
          setisProcessing(false);
          console.log(error);
        });
    } catch (error) {
      setisProcessing(false);
      switch (error.code) {
        case 'auth/internal-error': {
          setloginError('Error! Please Try Again.');
          break;
        }
        case 'auth/invalid-password': {
          setloginError('Invalid Password.');
          break;
        }
        case 'auth/wrong-password': {
          setloginError('Invalid Password.');
          break;
        }
        case 'auth/invalid-email': {
          setloginError('No User Found With This Email.');
          break;
        }
        case 'auth/session-cookie-expired': {
          setloginError('Session Expired Please Login Again.');
          break;
        }
        case 'auth/user-not-found': {
          setloginError('User Not Found.');
          break;
        }
        case 'auth/invalid-credential': {
          setloginError('Invalid Credentials.');
          break;
        }
        case 'auth/user-disabled': {
          setloginError('Your Account Has Been Disabled.');
          break;
        }
        default: {
          setloginError(error.message);
        }
      }
    }
  };

  return (
    <>
      <Stack spacing={3}>
        {loginError && <Alert severity="error">{loginError}</Alert>}

        <TextField
          name="email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          label="Email address"
        />

        <TextField
          name="password"
          label="Password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          l
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>
      {/*
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ my: 2 }}>
        <Checkbox name="remember" label="Remember me" />
        <Link variant="subtitle2" underline="hover">
          Forgot password?
        </Link>
      </Stack> */}

      <LoadingButton fullWidth size="large" type="submit" className="mt-3" variant="contained" onClick={doLogin}>
        Login
      </LoadingButton>
    </>
  );
}
