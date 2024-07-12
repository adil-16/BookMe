import React, { useState, useEffect } from 'react';

import { DataGrid } from '@mui/x-data-grid';
import {
  Card,
  Dialog,
  DialogActions,
  DialogTitle,
  Typography,
  Stack,
  Container,
  Button,
  TextField,
  FormControl,
  Box,
  Modal,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { getDownloadURL, uploadBytesResumable, ref, uploadBytes } from 'firebase/storage';

import { collection, getDocs, onSnapshot, setDoc, updateDoc, doc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link, useNavigate } from 'react-router-dom';
import Iconify from 'src/components/iconify/Iconify';
import { db, storage } from '../firebase';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: '#fff',
  p: 4,
  boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
};

export default function Category() {
  const [rows, setRows] = useState([]);
  const [isupdate, setisupdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setisProcessing] = useState(false);
  const [open, setOpen] = useState(false);
  const [Name, setName] = useState('');
  const [DocId, setDocId] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [UploadImage, setUploadImage] = useState(null);

  const navigate = useNavigate();
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'categories'), orderBy('name', 'asc')), (querySnapshot) => {
      const data = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));
      setRows(data);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      unsubscribe(); // Unsubscribe from the snapshot listener when the component unmounts
    };
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setName('');
  };
  const handleOpenUpdate = (name = '', id = '') => {
    setisupdate(true);
    setName(name);
    setDocId(id);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setName('');
    setisupdate(false);
    setUploadImage('');

    setisProcessing(false);
  };

  const handleClickOpen = (id) => {
    setOpenDialog(true);
    setDocId(id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDocId('');
    setisProcessing(false);
  };

  const deleteCategory = () => {
    setisProcessing(true);
    deleteDoc(doc(db, 'categories', DocId))
      .then(() => {
        toast.info('Category Deleted');
        handleCloseDialog();
        setRows(rows.filter((row) => row.id !== DocId));
      })
      .catch((error) => {
        handleCloseDialog();
        toast.error('Error! Unable to Delete Category');
        console.log(error);
      });
  };

  const addCategory = () => {
    if (isupdate) {
      if (!Name) {
        toast.error('Category name cant be empty');
        return;
      }
    } else {
      if (!Name || !UploadImage) {
        toast.error('Category name and image cant be empty');
        return;
      }
    }
    setisProcessing(true);

    try {
      var image = '';
      if (UploadImage) {
        const storageRef = ref(storage, `/Category/category_image${new Date()}`);
        const uploadTask = uploadBytesResumable(storageRef, UploadImage);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          },
          (err) => console.log(err),
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              image = url;
              saveCategory(image);
            } catch (error) {
              console.log('Error While Sending Notification', error);
              setisProcessing(false);
            }
          }
        );
      } else {
        saveCategory((image = ''));
      }
    } catch (error) {
      console.log('Error While Sending Notification', error);
      setisProcessing(false);
    }
  };

  const saveCategory = (image) => {
    var data = {};
    data.name = Name;
    if (image) {
      data.icon = image;
    }
    if (isupdate) {
      updateDoc(doc(db, 'categories', DocId), data)
        .then(() => {
          handleClose();
          toast.success('Category Updated');
        })
        .catch((error) => {
          handleClose();
          toast.error('Error! unable to Update Category');
          console.log(error);
        });
    } else {
      const newDoc = doc(collection(db, 'categories'));
      data.id = newDoc.id;
      setDoc(newDoc, data)
        .then(() => {
          handleClose();
          toast.success('Category Added');
        })
        .catch((error) => {
          handleClose();
          toast.error('Error! unable to Add Category');
          console.log(error);
        });
    }
  };

  const columns = [
    {
      field: 'icon',
      headerName: 'Icon',
      headerClassName: 'bg-light',
      flex: 1,
      renderCell: (params) => (
        <img
          src={params.value} // Assuming `params.value` is the URL of the image
          alt="Image"
          style={{ width: '60px', height: '60px' }}
        />
      ),
    },
    {
      field: 'name',
      headerName: 'Category',
      headerClassName: 'bg-light',
      flex: 1, // Distribute available space evenly
    },
    {
      field: 'Action',
      headerClassName: 'bg-light',
      flex: 1, // Distribute available space evenly
      editable: false,
      renderCell: ActionButton,
      align: 'right',
    },
  ];

  function ActionButton(params) {
    return (
      <>
        <Button
          variant="contained"
          color="primary"
          className="mx-2"
          size="small"
          startIcon={<Iconify icon="mdi:pencil" />}
          onClick={() => {
            handleOpenUpdate(params.row.name, params.row.id);
          }}
        >
          Edit
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          className="bg-danger mx-2"
          onClick={() => handleClickOpen(params.row.id)}
          startIcon={<Iconify icon="mdi:delete" />}
        >
          Delete
        </Button>
      </>
    );
  }

  return (
    <div>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{'Are you sure to Delete the Category?'}</DialogTitle>

        {isProcessing ? (
          <LinearProgress />
        ) : (
          <DialogActions>
            <Button onClick={() => deleteCategory()}>Yes</Button>
            <Button onClick={handleCloseDialog} autoFocus>
              No
            </Button>
          </DialogActions>
        )}
      </Dialog>
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

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <div>
            <Box style={{ display: 'flex', justifyContent: 'end' }}>
              <Iconify icon="mdi:close-circle" onClick={handleClose} style={{ cursor: 'pointer', color: 'gray' }} />
            </Box>
            <h2 className="mb-4" mb={3}>
              {!isupdate ? 'Add New Category' : 'Update Category'}
            </h2>

            <FormControl fullWidth size="small">
              <TextField
                className="mb-4"
                id="outlined-basic"
                label="Enter Name"
                variant="outlined"
                size="small"
                fullWidth
                value={Name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            <div className="mb-4">
              <label className="form-label col-12" htmlFor="uploadProfile">
                <b>Category Icon</b>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control col-12"
                  id="uploadProfile"
                  onChange={(e) => setUploadImage(e.target.files[0])}
                />
              </label>
              {isupdate ? (
                <small className="text-danger">Leave Empty if you do not want to update the icon.</small>
              ) : (
                ''
              )}
            </div>
            <Button
              fullWidth
              className="mt-2 muibtn"
              variant="contained"
              color="primary"
              disabled={isProcessing}
              onClick={() => addCategory()}
            >
              {isProcessing ? (
                <CircularProgress sx={{ color: 'white' }} size={27} />
              ) : (
                <>
                  <Iconify icon={'mdi:plus-thick'} style={{ marginRight: 10 }} />
                  {!isupdate ? 'Add Category' : 'Update Category'}
                </>
              )}
            </Button>
          </div>
        </Box>
      </Modal>
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            Service Categories
          </Typography>
          <Button onClick={() => handleOpen()} variant="contained" startIcon={<Iconify icon="eva:plus-fill" />}>
            Add New Category
          </Button>
        </Stack>

        <Card>
          <DataGrid
            style={{ height: '65vh', width: '100%' }}
            columns={columns}
            rows={rows}
            // getRowId={(Rows) => Rows._id}
            pageSize={6}
            rowsPerPageOptions={[5]}
            loading={loading}
            disableSelectionOnClick
          />
        </Card>
      </Container>
    </div>
  );
}
