import { Helmet } from 'react-helmet-async';
import { filter } from 'lodash';
import { useState, useEffect } from 'react';

// @mui
import {
  Card,
  Table,
  Stack,
  Paper,
  Button,
  Checkbox,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TablePagination,
  TextField,
  FormControl,
  Box,
  DialogActions,
  DialogContentText,
  DialogContent,
  DialogTitle,
  Avatar,
  Dialog,
  Switch,
  Modal,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

// components
import Label from '../components/label';
import Iconify from '../components/iconify';
import Scrollbar from '../components/scrollbar';
import DeleteConfirmationDialog from '../components/Dialogues/DeleteConfirmation';

// sections
import { UserListHead, UserListToolbar } from '../sections/@dashboard/user';
// mock
// import ReviewList from '../_mock/review';

//Firebase
import {
  collection,
  onSnapshot,
  getDoc,
  query,
  getDocs,
  where,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db, storage } from '../firebase';

//Toaster
import { toast } from 'react-toastify';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'review', label: 'Review', alignRight: false },
  { id: 'postedBy', label: 'Posted By', alignRight: false },
  { id: 'date', label: 'Date', alignRight: false },
  { id: 'ratting', label: 'Rattings', alignRight: false },
  { id: '' },
];

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(array, (_review) => _review.feedback.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis.map((el) => el[0]);
}

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

export default function Reviews() {
  const [open, setOpen] = useState(null);
  const [openView, setOpenView] = useState(null);

  const [page, setPage] = useState(0);

  const [order, setOrder] = useState('asc');

  const [selected, setSelected] = useState([]);

  const [orderBy, setOrderBy] = useState('name');

  const [filterName, setFilterName] = useState('');

  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedreviewToDelete, setSelectedreviewToDelete] = useState(null);

  const [selectedReviewToView, setSelectedReviewToView] = useState(null);

  const [ReviewList, setReviewList] = useState([]);

  const [isupdate, setisupdate] = useState('');

  const [Name, setReview] = useState('');
  const [rating, setRating] = useState('');

  const [isProcessing, setisProcessing] = useState(false);

  const [loading, setLoading] = useState(false); //To check if data if loaded or not from collection.

  useEffect(() => {
    const getData = async () => {
      // Inside your component or function
      const collectionRef = collection(db, 'reviews');
      onSnapshot(collectionRef, async (data) => {
        setReviewList([]);
        const newReviewList = [];

        for (const docs of data.docs) {
          const reviewData = docs.data();
          const userId = reviewData.userId;

          // Reference the user document using the UID
          const userDocRef = doc(db, 'users', userId);

          try {
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists()) {
              // Merge user data with review data
              const userData = userDocSnapshot.data();
              console.log('User Data', userData);
              const reviewWithUserData = { ...reviewData, id: docs.id, userData };
              newReviewList.push(reviewWithUserData);
            } else {
              // If user document doesn't exist, just add review data with no user data
              newReviewList.push({ ...reviewData, id: docs.id });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
        console.log(newReviewList);
        setReviewList(newReviewList);
        setLoading(false);
      });
    };

    getData();
  }, []);

  const handleCloseView = () => {
    setOpenView(null);
    handleCloseMenu();
  };
  const handleOpenView = (event) => {
    setOpenView(true);
  };
  const handleOpenDeleteDialog = (review) => {
    setDeleteDialogOpen(true);
    setSelectedreviewToDelete(review);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedreviewToDelete(null);
    setDeleteDialogOpen(false);
    handleCloseMenu();
  };
  const handleOpenMenu = (event, review) => {
    setSelectedReviewToView(review);
    setSelectedreviewToDelete(review.id);
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = ReviewList.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleOpen = () => {
    setOpen(true);
    setReview('');
  };
  const handleOpenUpdate = async (review = '') => {
    try {
      const providerDoc = await getDoc(doc(db, 'users', review.providerId));
      const serviceDoc = await getDoc(doc(db, 'services', review.serviceId));

      const providerData = providerDoc.data();
      const serviceData = serviceDoc.data();

      setSelectedReviewToView({
        ...review,
        provider: providerData,
        service: serviceData,
      });

      setisupdate(review.id);
      setOpen(true);
    } catch (error) {
      // Handle any errors that might occur during document retrieval
      console.error('Error fetching data:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setReview('');
    setRating('');
    setisupdate(false);
    setisProcessing(false);
  };
  const handleFeaturedChange = (id, status) => {
    console.log('ID', id);
    updateDoc(doc(db, 'reviews', id), { status: !status })
      .then(() => {
        if (!status) {
          toast.success('Review Approved');
        } else {
          toast.error('Review Rejected');
        }
      })
      .catch((error) => {
        toast.error('Error. Try Again');
        console.log(error);
      });
  };
  const updatereviews = async (updatedReviewList) => {
    if (isupdate) {
      setisProcessing(true);
      const reviewsDocRef = doc(db, 'reviews', isupdate);

      updateDoc(reviewsDocRef, { feedback: Name, rating: rating })
        .then(() => {
          setisProcessing(false);
          handleClose();
          toast.success('Review Updated');
        })
        .catch((error) => {
          handleClose();
          toast.error('Error! unable to Update review');
          setisProcessing(false);
          console.log(error);
        });
    }
  };

  const deleteSelectedData = async () => {
    selected.forEach((documentId) => {
      if (documentId) {
        deleteDoc(doc(db, 'reviews', documentId))
          .then(() => {
            toast.info('Review with ID ' + documentId + ' deleted successfully!');
            // Additional handling if needed
          })
          .catch((error) => {
            toast.error('Error deleting Review with ID ' + documentId);
            console.error('Error deleting Review with ID ' + documentId, error);
            // Additional error handling if needed
          });
      }
    });
  };

  const onDelete = async () => {
    try {
      deleteDoc(doc(db, 'reviews', selectedreviewToDelete))
        .then(() => {
          toast.info('Review deleted successfully!');
          // Additional handling if needed
        })
        .catch((error) => {
          toast.error('Error! Unable to Delete review');
          console.error('Error deleting Review with ID ' + error);
          // Additional error handling if needed
        });
    } catch (error) {
      toast.error('Error! Unable to Delete review');
      console.log(error);
    }

    handleCloseDeleteDialog();
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - ReviewList.length) : 0;

  const filteredreviews = applySortFilter(ReviewList, getComparator(order, orderBy), filterName);

  const isNotFound = !filteredreviews.length && !!filterName;

  return (
    <>
      <Helmet>
        <title> Reviews | BookMe </title>
      </Helmet>

      <Container>
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Delete review</DialogTitle>
          <DialogContent>
            <DialogContentText>Are you sure you want to delete the review?</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={() => onDelete()} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
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
              <DialogContent>
                {selectedReviewToView && (
                  <>
                    <Typography variant="h6">{selectedReviewToView?.userData?.userName}</Typography>
                    <Typography variant="body1">{selectedReviewToView?.review}</Typography>
                    <Typography variant="body1">
                      Rattings: <Iconify icon={'ph:star-fill'} className="text-warning me-1" />{' '}
                      {selectedReviewToView?.rating}
                    </Typography>
                    <Typography variant="body1">
                      Posted on: {selectedReviewToView?.createdOn?.toDate().toLocaleString()}
                    </Typography>
                    <br></br>
                    <Typography variant="h6">Provider : {selectedReviewToView?.provider?.userName}</Typography>
                    <Typography variant="body1">Service: {selectedReviewToView?.service?.title}</Typography>
                    <Typography variant="body1">Price: {selectedReviewToView?.service?.price}</Typography>
                  </>
                )}
              </DialogContent>
            </div>
          </Box>
        </Modal>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            All reviews
          </Typography>

          <div>
            {/* <Button onClick={() => handleOpen()} variant="contained" startIcon={<Iconify icon="eva:plus-fill" />}>
              Add New review
            </Button> */}
          </div>
        </Stack>
        <Card>
          <UserListToolbar
            onDelete={deleteSelectedData}
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <UserListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={ReviewList.length}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {filteredreviews.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((review) => {
                    const selectedreview = selected.indexOf(review.id) !== -1;

                    return (
                      <TableRow hover key={review.id} tabIndex={-1} role="checkbox" selected={selectedreview}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedreview} onChange={(event) => handleClick(event, review.id)} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" noWrap>
                            {review.review}
                          </Typography>
                        </TableCell>
                        <TableCell component="th" scope="row" padding="none">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar alt={review.userData.userName} src={review.userData.imageUrl} />
                            <Typography variant="subtitle2" noWrap>
                              {review.userData.userName}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" noWrap>
                            {review.createdOn.toDate().toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" noWrap>
                            <Iconify className="me-2" icon="fluent-emoji-flat:star" />
                            {review.rating}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Button
                            variant="contained"
                            onClick={() => {
                              handleOpenUpdate(review);
                            }}
                            sx={{ mr: 2 }}
                          >
                            <Iconify icon={'carbon:view-filled'} sx={{ mr: 2 }} />
                            View
                          </Button>

                          <Button
                            variant="contained"
                            className="bg-danger"
                            onClick={() => handleOpenDeleteDialog(review.id)}
                          >
                            <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>

                {isNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <Paper
                          sx={{
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h6" paragraph>
                            Not found
                          </Typography>

                          <Typography variant="body2">
                            No results found for &nbsp;
                            <strong>&quot;{filterName}&quot;</strong>.
                            <br /> Try checking for typos or using complete words.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={ReviewList.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>
    </>
  );
}
