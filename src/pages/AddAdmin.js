import React, { useState, useEffect } from 'react';

import { getFunctions, httpsCallable } from 'firebase/functions';
import Iconify from 'src/components/iconify/Iconify';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Helmet } from 'react-helmet-async';
import { setDoc, doc } from 'firebase/firestore';
// import { useAuth } from './AuthContext';

import { FormControl, TextField, Card, CardContent, CardHeader, Box, Button, Container } from '@mui/material';

import { getDownloadURL, uploadBytesResumable, ref, uploadBytes } from 'firebase/storage';
import CircularProgress from '@mui/material/CircularProgress';
import ProgressBar from '../components/ProgressBar';
import { db, storage } from '../firebase';

export default function AddAdmin() {
  const functions = getFunctions();
  const addNewUser = httpsCallable(functions, 'addUser');
  const makeAdmin = httpsCallable(functions, 'makeAdmin');

  const [isProcessing, setisProcessing] = useState(false);
  const [UploadImage, setUploadImage] = useState(null);
  const [group, setGroup] = useState('');
  const [UploadProgress, setUploadProgress] = useState(0);
  const [Code, setCode] = useState('');

  //   const { currentUser } = useAuth();

  const [Name, setName] = useState('');
  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('');
    setCode('');
    setGroup('');
    setUploadImage(null);
    setUploadProgress(0);
    document.getElementById('uploadProfile').value = '';
  }

  const addAdmin = () => {
    if (!Name || !Email || !Password) {
      toast.error('Kindly Fill All Required Fields');
      return;
    }

    setisProcessing(true);
    let data = {
      userName: Name,
      email: Email,
      role: 'admin',
      imageUrl: 'null',
      isDisabled: false,
      phone: '',
      createdOn: new Date(),
    };
    const authData = {
      email: Email,
      password: Password,
      emailVerified: true,
      disabled: false,
    };
    if (UploadImage) {
      const storageRef = ref(storage, `/Profiles/profile_picture_user_${Email}`);

      const uploadTask = uploadBytesResumable(storageRef, UploadImage);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(percent);
        },
        (err) => console.log(err),
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((url) => {
            data.imageUrl = url;
            authData.photoURL = url;
            addNewUser(authData)
              .then((user) => {
                data.id = user.data.uid;

                makeAdmin({ uid: user.data.uid }).then(() => {
                  setDoc(doc(db, 'users', user.data.uid), data).then(() => {
                    // setisProcessing(false);
                    toast.success('New User Added.');
                    setisProcessing(false);
                    resetForm();
                  });
                });
              })
              .catch((error) => {
                console.log(error);
                toast.error(error.message);
                setisProcessing(false);
              });
          });
        }
      );
    } else {
      addNewUser(authData)
        .then((user) => {
          data.id = user.data.uid;
          console.log('user is : ', user);
          makeAdmin({ uid: user.data.uid }).then(() => {
            console.log('first');
            setDoc(doc(db, 'users', user.data.uid), data).then(() => {
              console.log('second');
              // setisProcessing(false);
              toast.success('New User Added.');
              setisProcessing(false);
              resetForm();
            });
          });
        })
        .catch((error) => {
          setisProcessing(false);
          console.log(error);
          toast.error(error.message);
        });
    }
  };

  return (
    <>
      <Helmet>
        <title> Add Admin | Bookme </title>
      </Helmet>

      <Container>
        {/* <Stack direction="row" alignItems="center" justifyContent="start" mb={5}>
          <Typography variant="h4" gutterBottom>
            Add User
          </Typography>
        </Stack> */}

        <Card className="col-md-6 mx-auto">
          <CardHeader title="Add New Admin" />

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
                    <FormControl fullWidth>
                      <TextField
                        className="my-3"
                        id="outlined-basic"
                        label="Email"
                        variant="outlined"
                        fullWidth
                        value={Email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </FormControl>
                    <TextField
                      className="mb-3"
                      fullWidth
                      label="Password"
                      variant="outlined"
                      type="password"
                      value={Password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {/* <FormControl fullWidth className="mb-4" size="small">
                      <InputLabel id="demo-simple-select-label">Select Admin Role</InputLabel>
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
                    <div className="mb-4">
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
                    </div>
                  </div>

                  {UploadProgress > 1 ? <ProgressBar lable={'Uploading Image'} value={UploadProgress} /> : <></>}
                  <div className="d-flex">
                    <Button
                      fullWidth
                      className="mt-2 muibtn bg-secondary col me-2 py-2 bg-danger"
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={isProcessing}
                      onClick={() => resetForm()}
                    >
                      Clear
                    </Button>
                    <Button
                      fullWidth
                      className="mt-2 muibtn col ms-2 py-2"
                      variant="contained"
                      color="primary"
                      size="small"
                      disabled={isProcessing}
                      onClick={() => addAdmin()}
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
