import React, { useState, useEffect } from 'react';
import { getDownloadURL, uploadBytesResumable, ref } from 'firebase/storage';
import { storage } from '../firebase';
import { Card, Button, TextField, FormControl, Typography, Stack, Container, Box, Modal } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

import {
  getAuth,
  updateProfile,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Iconify from 'src/components/iconify/Iconify';
import Icon from 'src/components/color-utils/Icon';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: '#fff',
  boxShadow: 24,
  p: 4,
  boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
};

export default function Settings() {
  const [OldPassword, setOldPassword] = useState('');
  const [NewPassword, setNewPassword] = useState('');
  const [Email, setEmail] = useState('');
  const [UserName, setUserName] = useState('');
  const [Profile, setProfile] = useState('');
  const [open, setOpen] = useState(false);
  const [UploadImage, setUploadImage] = useState('');
  const [isProcessing, setisProcessing] = useState(false);

  const auth = getAuth();
  useEffect(() => {
    if (auth.currentUser !== null) {
      auth.currentUser.providerData.map((profile) => {
        setEmail(profile.email);
        setUserName(profile.displayName);
        setProfile(profile.photoURL);
      });
    }
  }, []);

  const handleOpen = (index) => {
    // setrowId(index);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const changePassword = () => {
    if (!OldPassword || !NewPassword) {
      toast.error('Input Fields Cant be Empty');
      return;
    }
    setisProcessing(true);
    const credential = EmailAuthProvider.credential(auth.currentUser.email, OldPassword);
    reauthenticateWithCredential(auth.currentUser, credential)
      .then(() => {
        updatePassword(auth.currentUser, NewPassword)
          .then(() => {
            // Update successful.
            setisProcessing(false);
            toast.success('Password Updated');
            setOldPassword('');
          })
          .catch((error) => {
            setisProcessing(false);
            toast.error(error.message);
          });
      })
      .catch((error) => {
        setisProcessing(false);
        setisProcessing(false);
        if (error.code === 'auth/wrong-password') {
          toast.error('Wrong Old Password');
        } else {
          toast.error(error.message);
        }
        console.log(error);
      });
  };

  const saveUser = (url) => {
    updateProfile(auth.currentUser, {
      displayName: UserName,
      photoURL: url,
    })
      .then(() => {
        updateEmail(auth.currentUser, Email)
          .then(() => {
            // Email updated!
            // ...
            setisProcessing(false);
            setProfile(url);
            toast.success('Profile Updated');
            setOldPassword('');
          })
          .catch((error) => {
            setisProcessing(false);
            // An error occurred
            toast.error(error);
            console.log(error);
            // ...
          });
      })
      .catch((error) => {
        setisProcessing(false);
        toast.error(error);
        console.log(error);
      });
  };
  const updateUser = () => {
    if (!OldPassword) {
      toast.error('Old Password Cant be Empty');
      return;
    }
    setisProcessing(true);
    const credential = EmailAuthProvider.credential(auth.currentUser.email, OldPassword);
    reauthenticateWithCredential(auth.currentUser, credential)
      .then(() => {
        if (UploadImage) {
          const storageRef = ref(storage, `/profile_images/${Email}`);

          const uploadTask = uploadBytesResumable(storageRef, UploadImage);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            },
            (err) => console.log(err),
            () => {
              getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                setUploadImage(null);
                saveUser(url);
              });
            }
          );
        } else {
          saveUser(Profile);
        }
      })
      .catch((error) => {
        if (error.code === 'auth/wrong-password') {
          toast.error('Wrong Old Password');
        } else {
          toast.error(error.message);
        }
        console.log(error);
      });
  };

  return (
    <>
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Account Settings
          </Typography>
        </Stack>

        <Card>
          <div className="row m-3">
            <div className=" mb-4 py-4 d-flex justify-content-start align-items-center">
              <img width="150px" height="150px" src={Profile || '/assets/images/avatars/avatar_default.jpg'} />

              <Button
                endIcon={<Iconify icon="mdi:upload" />}
                className="ms-5"
                variant="contained"
                size="large"
                component="label"
              >
                <input
                  hidden
                  type="file"
                  name="profile"
                  id="profile"
                  onChange={(e) => setUploadImage(e.target.files[0])}
                  accept="image/*"
                />
                Change Profile
              </Button>
              <Button
                endIcon={<Iconify icon="mdi:lock" />}
                className="ms-5"
                variant="contained"
                size="large"
                component="label"
                onClick={() => {
                  handleOpen();
                }}
              >
                Change Password
              </Button>
            </div>
            <div className="col-sm-6">
              <TextField
                className="col-12"
                id="userName"
                label="User Name"
                variant="outlined"
                value={UserName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className="col-sm-6">
              <TextField
                className="col-12"
                id="email"
                label="Email"
                variant="outlined"
                value={Email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="col-sm-6 mt-4">
              <TextField
                className="col-12"
                id="old_Password"
                label="Enter Old Password"
                variant="outlined"
                type="password"
                value={OldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>

            <Modal
              open={open}
              onClose={handleClose}
              aria-labelledby="modal-modal-title"
              aria-describedby="modal-modal-description"
            >
              <Box sx={style}>
                <form>
                  <Box style={{ display: 'flex', justifyContent: 'end' }}>
                    <Iconify
                      icon="mdi:close-circle-outline"
                      onClick={handleClose}
                      style={{ cursor: 'pointer', color: 'gray' }}
                    />
                  </Box>
                  <h2 className="mb-4" mb={3}>
                    Change Password
                  </h2>

                  <FormControl fullWidth>
                    <TextField
                      className="mb-4"
                      id="oldPassword"
                      label="Enter Old Password"
                      variant="outlined"
                      type="password"
                      fullWidth
                      value={OldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <TextField
                      className="mb-4"
                      id="newPassword"
                      label="Enter New Password"
                      variant="outlined"
                      fullWidth
                      value={NewPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </FormControl>

                  <Button
                    fullWidth
                    className="mt-2 muibtn"
                    variant="contained"
                    color="primary"
                    onClick={() => changePassword()}
                    disabled={isProcessing}
                  >
                    {' '}
                    {isProcessing ? <CircularProgress sx={{ color: 'white' }} size={27} /> : 'Save'}
                  </Button>
                </form>
              </Box>
            </Modal>

            <div className="col-12 d-flex justify-content-center mt-5">
              <Button
                variant="contained"
                size="large"
                component="label"
                onClick={() => updateUser()}
                disabled={isProcessing}
              >
                {isProcessing ? <CircularProgress sx={{ color: 'white' }} size={27} /> : ' Save Changes'}
              </Button>
            </div>
          </div>
        </Card>
      </Container>
    </>
  );
}
