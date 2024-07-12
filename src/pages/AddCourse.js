import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Autocomplete from '@mui/material/Autocomplete';

import { collection, doc, setDoc, orderBy, getDocs, query, updateDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import {
  Box,
  Button,
  Card,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Stack,
  Container,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { db, storage, app } from '../firebase';
import { useParams } from 'react-router-dom';
import QuillEditor from '../components/TextEditor/QuillEditor';
import Iconify from 'src/components/iconify/Iconify';
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  maxHeight: '85vh',
  transform: 'translate(-50%, -50%)',
  width: '70%', // Increase the width of the modal content
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflowY: 'auto', // Make the content scrollable
};

export default function AddCourse() {
  const { DocId } = useParams();

  const storage = getStorage();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [description, setDescription] = useState([]);
  const [open, setOpen] = useState(false);
  const [isProcessing, setisProcessing] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDescription, setChapterDescription] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [contentFile, setContentFile] = useState(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chapterToDeleteIndex, setChapterToDeleteIndex] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSummary, setCourseSummary] = useState('');
  const [coursePrice, setCoursePrice] = useState('');
  const [editContentIndex, setEditContentIndex] = useState(null);
  const [Categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [Companies, setCompanies] = useState([]);
  const [Category, setCategory] = useState('');
  const [Company, setCompany] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditContentIndex(null);
    setCurrentChapterIndex(null);
  };
  const handleViewFile = (fileURL) => {
    window.open(fileURL, '_blank');
  };
  const handlePhotoSelect = (e) => {
    const files = e.target.files;
    const selectedPhotosArray = Array.from(files);

    // Append new photos to the existing ones
    setSelectedPhotos((prevPhotos) => [...prevPhotos, ...selectedPhotosArray]);

    // Create previews for all selected photos
    const allSelectedPhotos = [...selectedPhotos, ...selectedPhotosArray];
    const photoPreviewsArray = allSelectedPhotos.map((photo) => URL.createObjectURL(photo));

    let combinedArray = [...existingPhotos, ...photoPreviewsArray];
    setPhotoPreviews(combinedArray);
  };
  const removeExistingPhoto = (index) => {
    const remainingPhotos = [...selectedPhotos];
    remainingPhotos.splice(index, 1);
    setSelectedPhotos(remainingPhotos);

    const remainingPreviews = [...photoPreviews];
    remainingPreviews.splice(index, 1);
    setPhotoPreviews(remainingPreviews);

    // Find and remove the element from existingPhotos (if it exists)
    const photoToRemove = photoPreviews[index]; // Assuming selectedPhotos and existingPhotos are the same
    const indexInExistingPhotos = existingPhotos.indexOf(photoToRemove);
    if (indexInExistingPhotos !== -1) {
      const updatedExistingPhotos = [...existingPhotos];
      updatedExistingPhotos.splice(indexInExistingPhotos, 1);
      setExistingPhotos(updatedExistingPhotos); // Assuming you have a state variable called existingPhotos and a corresponding setter setExistingPhotos
    }
  };

  // Function to upload photos to Firebase Storage
  const doUploadPhotos = async () => {
    const photoUrls = [];
    for (const photo of selectedPhotos) {
      const storageRef = app.storage().ref('Course_Photos');
      const fileName = `${Date.now()}_${photo.name}`;
      const uploadTask = storageRef.child(fileName).put(photo);
      const snapshot = await uploadTask;
      const downloadURL = await snapshot.ref.getDownloadURL();
      photoUrls.push(downloadURL);
    }
    return photoUrls;
  };
  const handleAddChapter = () => {
    const newChapter = {
      title: chapterTitle,
      description: chapterDescription,
      contents: [],
    };
    setChapters([...chapters, newChapter]);
    setChapterTitle('');
    setChapterDescription('');
    handleClose();
  };

  const handleDeleteChapterConfirmation = (chapterIndex) => {
    setDeleteConfirmationOpen(true);
    setChapterToDeleteIndex(chapterIndex);
  };

  const handleDeleteChapter = () => {
    const updatedChapters = [...chapters];
    updatedChapters.splice(chapterToDeleteIndex, 1);
    setChapters(updatedChapters);
    setDeleteConfirmationOpen(false);
    setChapterToDeleteIndex(null);
  };

  const handleCancelDeleteChapter = () => {
    setDeleteConfirmationOpen(false);
    setChapterToDeleteIndex(null);
  };

  const handleAddContent = async () => {
    try {
      if (!contentFile) {
        const newContent = {
          title: contentTitle,
          description: contentDescription,
          file: null,
        };

        const updatedChapters = [...chapters];
        if (editContentIndex !== null) {
          const { chapterIndex, contentIndex } = editContentIndex;
          newContent.file = updatedChapters[chapterIndex].contents[contentIndex].file;
          updatedChapters[chapterIndex].contents[contentIndex] = newContent;
        } else {
          updatedChapters[currentChapterIndex].contents.push(newContent);
        }
        setChapters(updatedChapters);
        setContentTitle('');
        setContentDescription('');
        setContentFile(null);
        setEditContentIndex(null);
        handleClose();
        return;
      }

      const storageRef = ref(storage, contentFile.name);
      const uploadTask = uploadBytesResumable(storageRef, contentFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.log(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((fileURL) => {
              const newContent = {
                title: contentTitle,
                description: contentDescription,
                file: fileURL,
              };

              const updatedChapters = [...chapters];
              if (editContentIndex !== null) {
                const { chapterIndex, contentIndex } = editContentIndex;
                updatedChapters[chapterIndex].contents[contentIndex] = newContent;
              } else {
                updatedChapters[currentChapterIndex].contents.push(newContent);
              }
              setChapters(updatedChapters);
              setContentTitle('');
              setContentDescription('');
              setContentFile(null);
              setEditContentIndex(null);
              handleClose();
              setUploadProgress(0);
            })
            .catch((error) => {
              console.log(error);
            });
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteContent = (chapterIndex, contentIndex) => {
    const updatedChapters = [...chapters];
    updatedChapters[chapterIndex].contents.splice(contentIndex, 1);
    setChapters(updatedChapters);
  };

  const handleAddChapterForm = () => {
    setCurrentChapterIndex(null);
    setChapterTitle('');
    setChapterDescription('');
    handleOpen();
  };

  const handleAddContentForm = (chapterIndex) => {
    setCurrentChapterIndex(chapterIndex);
    setContentTitle('');
    setContentDescription('');
    setContentFile(null);
    handleOpen();
  };

  const handleEditContent = (chapterIndex, contentIndex) => {
    setEditContentIndex({ chapterIndex, contentIndex });
    setCurrentChapterIndex(chapterIndex);
    const content = chapters[chapterIndex].contents[contentIndex];
    setContentTitle(content.title);
    setContentDescription(content.description);
    setContentFile(null);

    handleOpen();
  };
  function doUploadCoverPhoto(file) {
    const storageRef = app.storage().ref('Courses_CoverPhotos');
    const fileName = `${Date.now()}_${file.name}`;
    const uploadTask = storageRef.child(`CoverPhotos/${fileName}`).put(file);
    return uploadTask.then((snapshot) => snapshot.ref.getDownloadURL());
  }
  const handleSaveCourse = async () => {
    const data = {
      title: courseTitle,
      // summary: courseSummary,
      price: coursePrice,
      description: description,
      chapters: chapters,
      freeCategories: selectedCategories.map((selectedAudio) =>
        Categories.find((audio) => audio.id === selectedAudio.value)
      ),
    };
    const photoUrls = await doUploadPhotos();
    // Include photoUrls in the data object

    data.photos = [...existingPhotos, ...photoUrls];
    if (coverPhoto) {
      const coverPhotoUrl = await doUploadCoverPhoto(coverPhoto);
      data.coverPhotoUrl = coverPhotoUrl;
    }

    try {
      if (DocId) {
        // Update existing document
        await updateDoc(doc(db, 'courses', DocId), data);
        toast.success('Course updated successfully');
      } else {
        // Add new document
        await setDoc(doc(collection(db, 'courses')), data);
        toast.success('Course added successfully');
      }
    } catch (error) {
      console.log(error);
      toast.error('An error occurred. Please try again.');
    }
  };

  useEffect(() => {
    const getData = async () => {
      const data = await getDocs(query(collection(db, 'Category'), orderBy('name', 'asc')));

      data.docs.map((document) => {
        setCategories((row) => [
          ...row,
          {
            ...document.data(),
          },
        ]);
      });
      const companyData = await getDocs(query(collection(db, 'Company'), orderBy('name', 'asc')));

      companyData.docs.map((document) => {
        setCompanies((row) => [
          ...row,
          {
            ...document.data(),
          },
        ]);
      });
    };
    getData();
    if (DocId) {
      const unsubscribe = onSnapshot(doc(db, 'courses', DocId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCourseTitle(data.title);
          // setCourseSummary(data.summary);
          setCoursePrice(data.price);
          setChapters(data.chapters);
          setDescription(data.description);
          if (data.photos) {
            setPhotoPreviews(data.photos);
            setExistingPhotos(data.photos);
          }
          if (data.freeCategories) {
            data.freeCategories.forEach((audio) => {
              const selectedAudio = {
                label: audio.name,
                value: audio.id,
              };

              selectedCategories.push(selectedAudio);
            });
          }
        }
      });

      return () => unsubscribe();
    }
  }, [DocId]);

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
        <Stack direction="row" alignItems="center" justifyCourse="start" mb={5}>
          <Typography variant="h4" gutterBottom>
            {DocId ? 'Update Course' : 'Add New Course'}
          </Typography>
        </Stack>
        <Card>
          <div className="m-5" style={{ width: 'auto', height: 'auto', backgroundColor: '#fff' }}>
            <div>
              <div className="row mt-4 pb-4">
                <div className="col-12">
                  <TextField
                    id="outlined-basic"
                    label="Course Title"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="row mt-4 pb-4">
                <lable className="col-12">
                  Upload Cover Photo
                  <input
                    id="uploadCoverPhoto"
                    onChange={(e) => setCoverPhoto(e.target.files[0])}
                    type="file"
                    accept="image/*"
                    className="form-control w-100"
                  />
                </lable>
              </div>
              <FormControl fullWidth className="mb-4" size="small">
                <InputLabel id="demo-simple-select-label">Select Category</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  value={Category}
                  id="product_Categories"
                  label="Status"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {Categories?.map((cat) => {
                    return <MenuItem value={cat.name}>{cat.name}</MenuItem>;
                  })}
                </Select>
              </FormControl>
              <FormControl fullWidth className="mb-4" size="small">
                <InputLabel id="demo-simple-select-label">Select Company</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  value={Company}
                  id="product_Companies"
                  label="Status"
                  onChange={(e) => setCompany(e.target.value)}
                >
                  {Companies?.map((cat) => {
                    return <MenuItem value={cat.name}>{cat.name}</MenuItem>;
                  })}
                </Select>
              </FormControl>
              <div className="row mt-4 pb-4">
                <div className="col-md-3">
                  <h6
                    style={{
                      marginTop: '10px',
                      marginLeft: '20px',
                      fontWeight: 'bold',
                    }}
                  >
                    Course Description
                  </h6>
                </div>

                <div className="col-md-12">
                  <QuillEditor value={description} onChange={(value) => setDescription(value)} />
                  {/* <TextField
                    id="outlined-basic"
                    label="Course Description"
                    variant="outlined"
                    size="small"
                    multiline
                    rows={10}
                    fullWidth
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  /> */}
                </div>
              </div>
              <div className="row mt-4 pb-4">
                <div className="col-12 ">
                  <Button variant="contained" onClick={handleAddChapterForm}>
                    Add New Chapter
                  </Button>
                  <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                  >
                    <Box sx={style}>
                      {currentChapterIndex === null ? (
                        <div>
                          <TextField
                            id="outlined-basic"
                            label="Chapter Title"
                            variant="outlined"
                            size="small"
                            className="my-5"
                            fullWidth
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                          />
                          <QuillEditor value={chapterDescription} onChange={(value) => setChapterDescription(value)} />

                          {/* <TextField
                            id="outlined-basic"
                            label="Chapter Description"
                            variant="outlined"
                            className="mt-4"
                            size="small"
                            fullWidth
                            value={chapterDescription}
                            onChange={(e) =>
                              setChapterDescription(e.target.value)
                            }
                          /> */}
                          <Button
                            style={{
                              marginTop: '15px',
                            }}
                            variant="contained"
                            onClick={handleAddChapter}
                          >
                            Add Chapter
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <TextField
                            id="outlined-basic"
                            label="Content Title"
                            variant="outlined"
                            className="my-4"
                            size="small"
                            fullWidth
                            value={contentTitle}
                            onChange={(e) => setContentTitle(e.target.value)}
                          />
                          <QuillEditor value={contentDescription} onChange={(value) => setContentDescription(value)} />
                          {/* <TextField
                            id="outlined-basic"
                            label="Content Description"
                            variant="outlined"
                            size="small"
                            className="mt-4"
                            fullWidth
                            value={contentDescription}
                            onChange={(e) =>
                              setContentDescription(e.target.value)
                            }
                          /> */}
                          {/* <div className="row" style={{ marginTop: "15px" }}>
                            <div className="col-md-8">
                              <h6
                                style={{
                                  marginTop: "10px",
                                  fontWeight: "bold",
                                }}
                              >
                                Add File
                              </h6>
                            </div>
                            <div className="col-12">
                              <input
                                className="form-control"
                                type="file"
                                onChange={(e) =>
                                  setContentFile(e.target.files[0])
                                }
                              />
                            </div>
                          </div>
                          {contentFile && (
                            <LinearProgress
                              variant="determinate"
                              value={uploadProgress}
                              style={{ marginTop: "10px" }}
                            />
                          )} */}
                          <Button
                            style={{
                              marginTop: '15px',
                            }}
                            variant="contained"
                            onClick={handleAddContent}
                          >
                            {editContentIndex !== null ? 'Update Content' : 'Add Content'}
                          </Button>
                        </div>
                      )}
                    </Box>
                  </Modal>
                </div>
              </div>

              {/* Chapters and Contents Display */}
              {chapters.map((chapter, chapterIndex) => (
                <Paper key={chapterIndex} elevation={3} style={{ marginBottom: '20px' }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell style={{ fontWeight: 'bold' }}>Chapter Title</TableCell>
                          <TableCell style={{ fontWeight: 'bold' }}>Chapter Description</TableCell>
                          <TableCell style={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow key={chapterIndex}>
                          <TableCell>{chapter.title}</TableCell>
                          <TableCell>{chapter.description}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => handleAddContentForm(chapterIndex)}>
                              <Iconify icon="mdi:plus-circle" />
                            </IconButton>
                            {/* <IconButton
                              size="small"
                              onClick={() => handleEditContent(chapterIndex, null)}
                            >
                              <Iconify icon="mdi:pencil" />
                            </IconButton> */}
                            <IconButton size="small" onClick={() => handleDeleteChapterConfirmation(chapterIndex)}>
                              <Iconify icon="ic:baseline-delete" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {chapter.contents.length > 0 && (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell style={{ fontWeight: 'bold' }}>Content Title</TableCell>
                            <TableCell style={{ fontWeight: 'bold' }}>Content Description</TableCell>
                            <TableCell style={{ fontWeight: 'bold' }}>File</TableCell>
                            <TableCell style={{ fontWeight: 'bold' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {chapter.contents.map((content, contentIndex) => (
                            <TableRow key={contentIndex}>
                              <TableCell>{content.title}</TableCell>
                              <TableCell>{content.description}</TableCell>
                              <TableCell>
                                {content.file && (
                                  <IconButton size="small" onClick={() => handleViewFile(content.file)}>
                                    <Iconify icon="mdi:eye" />
                                  </IconButton>
                                )}
                              </TableCell>
                              <TableCell>
                                <IconButton size="small" onClick={() => handleEditContent(chapterIndex, contentIndex)}>
                                  <Iconify icon="mdi:pencil" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteContent(chapterIndex, contentIndex)}
                                >
                                  <Iconify icon="ic:baseline-delete" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              ))}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '20px',
            }}
          >
            <Button
              style={{
                width: '200px',
              }}
              variant="contained"
              size="large"
              className="mb-5"
              onClick={handleSaveCourse}
            >
              {DocId ? 'Update Course' : 'Save Course'}
            </Button>
          </div>
        </Card>

        {/* Delete Chapter Confirmation Dialog */}
        <Dialog open={deleteConfirmationOpen} onClose={handleCancelDeleteChapter}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete this chapter?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDeleteChapter} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDeleteChapter} color="secondary">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
