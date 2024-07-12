import React from 'react';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function DeleteConfirmation({ open, onClose, subtitle, heading, email, displayName, docId, colName }) {
  const onDelete = async () => {
    if (colName == 'users') {
      //If deleteing A user also delete it from firebase auth
      const functions = getFunctions();
      const removeUserData = httpsCallable(functions, 'removeUserData');
      removeUserData({ uid: docId, email: email, displayName: displayName })
        .then(() => {
          toast.info(subtitle + ' deleted successfully!');
          onClose();
        })
        .catch((error) => {
          toast.error('Error deleting ' + subtitle);
          console.error('Error deleting : ' + subtitle, error);
          onClose();
        });
    } else {
      console.log(db + colName + docId);
      //To delete normal docu ments from Colllections
      deleteDoc(doc(db, colName, docId))
        .then(() => {
          toast.info(subtitle + ' deleted successfully!');
          onClose();
        })
        .catch((error) => {
          toast.error('Error deleting ' + subtitle);
          console.error('Error deleting : ' + subtitle, error);
          onClose();
        });
    }
  };
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{heading}</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you sure you want to delete the {subtitle}?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={() => onDelete()} color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
