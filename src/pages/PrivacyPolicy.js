import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, Button, TextField, Box, Container, Typography } from '@mui/material';

import { collection, getDocs, setDoc, updateDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';

import { useParams } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { db } from '../firebase';

export default function PrivacyPolicy() {
  const [privacy_Policy, setPrivacyPolicy] = useState('');
  const [AboutUs, setAboutUs] = useState('');
  const [Order, setOrder] = useState(0);
  const [isProcessing, setisProcessing] = useState(false);
  const [tutorials, setTutorials] = useState([]);

  useEffect(() => {
    getDoc(doc(db, 'settings', 'privacy-about')).then((res) => {
      setPrivacyPolicy(res.data().privacyPolicy);
      setAboutUs(res.data().termsAndconditions);
      setOrder(res.data().order);
    });
  }, []);

  const addContent = (event) => {
    var data = {
      privacyPolicy: privacy_Policy,
      termsAndconditions: AboutUs,
    };

    if (!privacy_Policy && !AboutUs) {
      toast.error('Kindly Fill All Input Fields');
      return;
    }

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
    const documentId = 'privacy-about';

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

  return (
    <>
      <Helmet>
        <title> Privacy Policy and Terms and Conditions | BookMe </title>
      </Helmet>

      <Container>
        <Card style={{ padding: 60, borderRadius: 10 }}>
          {/* ... */}
          <div className="mt-2">
            <Box component="form" noValidate autoComplete="off">
              <Typography variant="h3" className="text-center">
                Terms and Conditions
              </Typography>

              <TextField
                id="outlined-multiline-flexible"
                label="About Us"
                className="col-12"
                multiline
                maxRows={5}
                value={AboutUs}
                onChange={(e) => setAboutUs(e.target.value)}
              />
              {/* <QuillEditor /> */}
              <div style={{ marginTop: '60px' }} className="d-flex justify-content-center">
                <Typography variant="h3">Privacy Policy</Typography>
              </div>

              <TextField
                id="outlined-multiline-flexible"
                label="Privacy Policy"
                className="col-12"
                multiline
                maxRows={5}
                value={privacy_Policy}
                onChange={(e) => setPrivacyPolicy(e.target.value)}
              />

              {/* <QuillEditor value={privacy_Policy} onChange={(value) => setPrivacyPolicy(value)} /> */}

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
