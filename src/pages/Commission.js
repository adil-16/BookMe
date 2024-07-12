import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, Button, TextField, Box, Container, Typography } from '@mui/material';

import { collection, getDocs, setDoc, updateDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';

import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { db } from '../firebase';
import QuillEditor from '../components/TextEditor/QuillEditor';

export default function Commission() {
  const [businessCommission, setBusinessCommission] = useState('');
  const [CustomerCommission, setCustomerCommission] = useState('');
  const [sponsershipFee, setsponsershipFee] = useState('');
  const [Order, setOrder] = useState(0);
  const [isProcessing, setisProcessing] = useState(false);
  const [tutorials, setTutorials] = useState([]);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'commission')).then((res) => {
      setBusinessCommission(res.data().businessCommission || '');
      setCustomerCommission(res.data().customerCommission || '');
      setsponsershipFee(res.data().sponsershipFee || '');
    });
  }, []);

  const addContent = (event) => {
    var data = {
      businessCommission: businessCommission,
      customerCommission: CustomerCommission,
      sponsershipFee: sponsershipFee,
    };

    setisProcessing(true);

    // Check for conflicts
    const tutorialWithSameOrder = tutorials.find((tutorial) => tutorial.order === Order);
    if (tutorialWithSameOrder) {
      // Conflicting order number found
      const tutorialsToUpdate = tutorials.slice(tutorials.indexOf(tutorialWithSameOrder) + 1);
      // Increment the order numbers of tutorials after the conflict
      const updatedTutorials = tutorialsToUpdate.map((tutorial) => ({
        ...tutorial,
        order: tutorial.order + 1,
      }));
      // Update the tutorials in the database with the adjusted order numbers
      const updatePromises = updatedTutorials.map((tutorial) =>
        updateDoc(doc(db, 'settings', tutorial.id), { order: tutorial.order })
      );
      Promise.all(updatePromises)
        .then(() => {
          // After updating the order numbers of conflicting tutorials, save the new tutorial
          saveTutorial(data);
        })
        .catch((error) => {
          setisProcessing(false);
          toast.error('Error updating order numbers: ' + error.message);
          console.error('Error updating order numbers:', error);
        });
    } else {
      // No conflict, save the new tutorial directly
      saveTutorial(data);
    }
  };
  const saveTutorial = (data) => {
    // Define the document ID you want to use (e.g., 'privacy-about')
    const documentId = 'commission';

    // Create a reference to the document
    const docRef = doc(db, 'settings', documentId);

    // Check if the document already exists
    getDoc(docRef)
      .then((documentSnapshot) => {
        if (documentSnapshot.exists()) {
          // Document exists, update it with the new data
          return setDoc(docRef, data, { merge: true });
        } else {
          // Document doesn't exist, create it with the new data
          return setDoc(docRef, data);
        }
      })
      .then(() => {
        // Success
        setisProcessing(false);
        toast.success('Data Saved.');
      })
      .catch((error) => {
        // Error handling
        setisProcessing(false);
        toast.error('Error! Unable to add/update data.');
        console.log(error);
      });
  };
  const handleBusinessChange = (e) => {
    const inputValue = e.target.value;

    // Check if the input is a number and greater than 0
    if (inputValue === '' || (!isNaN(inputValue) && parseFloat(inputValue) > 0)) {
      setBusinessCommission(inputValue);
    } else {
      // Invalid input, you can handle this by showing an error message
      toast.error('Invalid input. Please enter a number greater than 0.');
    }
  };
  const handleCustomerChange = (e) => {
    const inputValue = e.target.value;

    // Check if the input is a number and greater than 0
    if (inputValue === '' || (!isNaN(inputValue) && parseFloat(inputValue) > 0)) {
      setCustomerCommission(inputValue);
    } else {
      // Invalid input, you can handle this by showing an error message
      toast.error('Invalid input. Please enter a number greater than 0.');
    }
  };
  const handleFeeChange = (e) => {
    const inputValue = e.target.value;

    // Check if the input is a number and greater than 0
    if (inputValue === '' || (!isNaN(inputValue) && parseFloat(inputValue) > 0)) {
      setsponsershipFee(inputValue);
    } else {
      // Invalid input, you can handle this by showing an error message
      toast.error('Invalid input. Please enter a number greater than 0.');
    }
  };
  return (
    <>
      <Helmet>
        <title> Commissions | Book Me </title>
      </Helmet>

      <Container>
        <Card style={{ padding: 60, borderRadius: 10 }}>
          {/* ... */}
          <div className="mt-2">
            <Box component="form" noValidate autoComplete="off">
              <Typography variant="h3" className="text-center">
                Customer Commission
              </Typography>

              <TextField
                id="outlined-multiline-flexible"
                label="Customer Commission"
                className="col-12"
                value={CustomerCommission}
                onChange={handleCustomerChange}
              />
              {/* <QuillEditor /> */}
              <div style={{ marginTop: '60px' }} className="d-flex justify-content-center">
                <Typography variant="h3">Business Commision</Typography>
              </div>

              <TextField
                id="outlined-multiline-flexible"
                label="Business Commision"
                className="col-12"
                value={businessCommission}
                onChange={handleBusinessChange}
              />
              {/* <div style={{ marginTop: '60px' }} className="d-flex justify-content-center">
                <Typography variant="h3">Sponsership Fee</Typography>
              </div>

              <TextField
                id="outlined-multiline-flexible"
                label="Sponsership Fee"
                className="col-12"
                value={sponsershipFee}
                onChange={handleFeeChange}
              /> */}

              {/* <QuillEditor value={businessCommission} onChange={(value) => setBusinessCommission(value)} /> */}

              <div style={{ marginTop: '60px' }} className="d-flex justify-content-center">
                <Button
                  variant="contained"
                  color="primary"
                  className="mb-4"
                  disabled={isProcessing}
                  // startIcon={<CheckCircleIcon />}
                  onClick={() => addContent()}
                  // onClick={startUploadManually}
                >
                  {isProcessing ? <CircularProgress sx={{ color: 'white' }} size={27} /> : <>{'Save'}</>}
                </Button>
              </div>
            </Box>
          </div>
        </Card>
      </Container>
    </>
  );
}
