import React, { useState, useEffect } from 'react';

import { getFunctions, httpsCallable } from 'firebase/functions';
import Iconify from 'src/components/iconify/Iconify';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Helmet } from 'react-helmet-async';
import {
  collection,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  doc,
  query,
  orderBy,
  deleteDoc,
  limit,
  where,
  getDoc,
} from 'firebase/firestore';
// import { useAuth } from './AuthContext';

import {
  FormControl,
  Modal,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardHeader,
  Box,
  Button,
  Container,
  Stack,
  IconButton,
  Typography,
} from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import { getDownloadURL, uploadBytesResumable, ref, uploadBytes } from 'firebase/storage';
import CircularProgress from '@mui/material/CircularProgress';
import ProgressBar from '../components/ProgressBar';
import { db, storage } from '../firebase';

export default function AddUser() {
  const functions = getFunctions();
  const addNewUser = httpsCallable(functions, 'addUser');

  const [isProcessing, setisProcessing] = useState(false);
  const [UploadImage, setUploadImage] = useState(null);
  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState('');
  const [UploadProgress, setUploadProgress] = useState(0);
  const [roles, setRoles] = useState(['Super Admin', 'Admin', 'User']);
  const [Code, setCode] = useState('');

  useEffect(() => {
    handleGenerateCode();
  }, []);

  const handleGenerateCode = () => {
    // Generate a random 8-character string for the unique ID
    const uniqueString = Math.random().toString(36).substring(2, 8);
    setCode(uniqueString);
  };

  // const { currentUser } = useAuth();

  // useEffect(() => {
  //   if (currentUser.role == "Super Admin") {
  //     setRoles(["Super Admin", "Admin", "Content Admin", "User"]);
  //   } else if (currentUser.role == "Admin") {
  //     setRoles(["Content Admin", "User"]);
  //   } else {
  //     setRoles(["User"]);
  //   }
  // }, []);

  const [Name, setName] = useState('');
  const [Email, setEmail] = useState('');

  function resetForm() {
    setName('');
    setEmail('');
    setCode('');
    setGroup('');
    setUploadImage(null);
    setUploadProgress(0);
    document.getElementById('uploadProfile').value = '';
  }

  const updateUser = () => {
    if (!Name || !Code || !group) {
      toast.error('Kindly Fill All Required Fields');
      return;
    }

    toast.success('User Added');

    // setisProcessing(true);
    // let data = {
    //   name: Name,
    //   email: Email,
    //   role: group,
    //   image: 'null',
    //   created_at: new Date(),
    // };
    // const authData = {
    //   email: Email,
    //   Code: Code,
    //   emailVerified: true,
    //   disabled: false,
    //   role: group,
    // };
    // if (UploadImage) {
    //   const storageRef = ref(storage, `/Profiles/profile_picture_user_${Email}`);

    //   const uploadTask = uploadBytesResumable(storageRef, UploadImage);

    //   uploadTask.on(
    //     'state_changed',
    //     (snapshot) => {
    //       const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
    //       setUploadProgress(percent);
    //     },
    //     (err) => console.log(err),
    //     () => {
    //       getDownloadURL(uploadTask.snapshot.ref).then((url) => {
    //         data.image = url;
    //         authData.photoURL = url;
    //         addNewUser(authData)
    //           .then((user) => {
    //             console.log('User Added');
    //             data.uid = user.data.uid;

    //             setDoc(doc(db, 'users', user.data.uid), data).then(() => {
    //               // setisProcessing(false);
    //               toast.success('New User Added.');
    //               setisProcessing(false);
    //               resetForm();
    //             });
    //           })
    //           .catch((error) => {
    //             console.log(error);
    //             toast.error(error.message);
    //             setisProcessing(false);
    //           });
    //       });
    //     }
    //   );
    // } else {
    //   addNewUser(authData)
    //     .then((user) => {
    //       setDoc(doc(db, 'users', user.data.uid), data).then(() => {
    //         // setisProcessing(false);
    //         setisProcessing(false);
    //         toast.success('New User Added.');
    //         resetForm();
    //       });
    //     })
    //     .catch((error) => {
    //       setisProcessing(false);
    //       console.log(error);
    //       toast.error(error.message);
    //     });
    // }
  };

  return (
    <>
      <Helmet>
        <title> User | Bookme </title>
      </Helmet>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Container>
        {/* <Stack direction="row" alignItems="center" justifyContent="start" mb={5}>
          <Typography variant="h4" gutterBottom>
            Add User
          </Typography>
        </Stack> */}

        <Card className="col-md-6 mt-5 mx-auto">
          <CardHeader title="Add New User" />

          <CardContent>
            <Box className="d-flex justify-content-center mb-4">
              <div className="d-flex justify-content-center mb-4">
                <form className="col-12">
                  <div>
                    <FormControl fullWidth size="small">
                      <TextField
                        id="outlined-basic-0"
                        label="Name"
                        variant="outlined"
                        fullWidth
                        value={Name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </FormControl>
                    {/* <FormControl fullWidth size="small">
                      <TextField
                        className="mb-4"
                        id="outlined-basic"
                        label="Email"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={Email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </FormControl> */}
                    <TextField
                      className="my-3"
                      fullWidth
                      label="User Code"
                      variant="outlined"
                      value={Code}
                      onChange={(e) => setCode(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={handleGenerateCode}>
                            <Iconify icon="mdi:autorenew" />
                          </IconButton>
                        ),
                      }}
                      required
                    />
                    {/* <FormControl fullWidth className="mb-4" size="small">
                      <InputLabel id="demo-simple-select-label">Select User Role</InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        value={group}
                        id="product_groups"
                        label="Status"
                        onChange={(e) => setGroup(e.target.value)}
                      >
                        {roles?.map((cat, index) => (
                          <MenuItem key={index} value={cat}>
                            {cat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl> */}
                    {/* <div className="mb-4">
                      <label className="form-label col-12" htmlFor="uploadProfile">
                        <b>Profile Picture</b>
                        <input
                          type="file"
                          accept="image/*"
                          className="form-control col-12"
                          id="uploadProfile"
                          onChange={(e) => setUploadImage(e.target.files[0])}
                        />
                      </label>
                    </div> */}
                  </div>

                  {UploadProgress > 1 ? <ProgressBar lable={'Uploading Image'} value={UploadProgress} /> : <></>}
                  <div className="d-flex">
                    <Button
                      fullWidth
                      className="mt-2 muibtn bg-secondary col me-2 py-2"
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={isProcessing}
                      onClick={() => resetForm()}
                    >
                      Cancel
                    </Button>
                    <Button
                      fullWidth
                      className="mt-2 muibtn col ms-2 py-2"
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={isProcessing}
                      onClick={() => updateUser()}
                    >
                      {isProcessing ? <CircularProgress size={27} /> : 'Register '}
                    </Button>
                  </div>
                </form>
              </div>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
