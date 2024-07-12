import { useEffect } from 'react';
import React from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LogoutRoute() {
  const { logout } = useAuth();
  const navigate = useNavigate(); // Add this line

  const handelLogout = async () => {
    try {
      console.log('Logout');
      await logout();
      navigate('/login'); // Use the navigate function
    } catch (error) {
      alert('Error' + error.code);
    }
  };

  useEffect(() => {
    handelLogout();
  }, []);

  return <></>;
}
