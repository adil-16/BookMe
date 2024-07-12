import { Helmet } from 'react-helmet-async';
import { filter } from 'lodash';
import { useState, useEffect } from 'react';
// @mui
import {
  Card,
  Table,
  Stack,
  Paper,
  Avatar,
  Button,
  Popover,
  Checkbox,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  Container,
  Typography,
  IconButton,
  TableContainer,
  Switch,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import { Link } from 'react-router-dom';

// components
import Label from '../components/label';
import Iconify from '../components/iconify';
import Scrollbar from '../components/scrollbar';
import DeleteConfirmationDialog from '../components/Dialogues/DeleteConfirmation';

// sections
import { UserListHead, UserListToolbar } from '../sections/@dashboard/user';
// mock
// import SERVICELIST from '../_mock/user';

//Firebase
import { collection, getDoc, updateDoc, doc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import axios from 'axios';

import { toast } from 'react-toastify';
// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'price', label: 'Price', alignRight: false },
  { id: 'service', label: 'Service Title', alignRight: false },
  // { id: 'isVerified', label: 'Verified', alignRight: false },
  { id: 'postedby', label: 'Provider', alignRight: false },
  { id: 'bookedby', label: 'Customer', alignRight: false },
  { id: 'location', label: 'Location', alignRight: false },
  { id: 'date', label: 'Date', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
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
    return filter(
      array,
      (_user) =>
        _user.userName.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        _user.email.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        _user.phone.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function UserPage() {
  const [open, setOpen] = useState(null);
  const [openView, setOpenView] = useState(null);

  const [page, setPage] = useState(0);

  const [order, setOrder] = useState('asc');

  const [selected, setSelected] = useState([]);

  const [orderBy, setOrderBy] = useState('name');

  const [filterName, setFilterName] = useState('');

  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const [selectedUserToDelete, setSelectedUserToDelete] = useState(null);

  const [selectedUserToView, setSelectedUserToView] = useState(null);

  const [SERVICELIST, setSERVICELIST] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const collectionRef = collection(db, 'bookings');

      try {
        const unsubscribe = onSnapshot(collectionRef, async (querySnapshot) => {
          // Handle each snapshot change
          const userPromises = querySnapshot.docs.map(async (document) => {
            const reviewData = document.data();
            const providerId = reviewData.providerId;
            const userId = reviewData.userId;

            const userDocRef = doc(db, 'users', providerId);
            const customerDocRef = doc(db, 'users', userId);

            // Use Promise.all to wait for both promises
            const [providerSnapshot, customerSnapshot] = await Promise.all([
              getDoc(userDocRef),
              getDoc(customerDocRef),
            ]);

            return {
              bookingId: document.id,
              reviewData: { ...reviewData, id: document.id },
              providerData: providerSnapshot.exists() ? providerSnapshot.data() : null,
              customerData: customerSnapshot.exists() ? customerSnapshot.data() : null,
            };
          });

          // Resolve all promises and set the merged data in the state
          const resolvedData = await Promise.all(userPromises);
          const newServiceList = resolvedData.map(({ bookingId, reviewData, providerData, customerData }) => {
            const mergedData = {
              ...reviewData,
              id: bookingId,
              userData: providerData,
              customerData,
            };
            return mergedData;
          });

          setSERVICELIST(newServiceList);
          setLoading(false);
        });

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    getData();
  }, []);

  const handleCloseView = () => {
    setOpenView(null);
  };
  const handleOpenView = (event) => {
    setOpenView(true);
  };
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedUserToDelete(null);
    setDeleteDialogOpen(false);
    handleCloseMenu();
  };
  const handleOpenCancelDialog = () => {
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setSelectedUserToDelete(null);
    setCancelDialogOpen(false);
    handleCloseMenu();
  };
  const handleOpenMenu = (event, user) => {
    setSelectedUserToView(user);
    setSelectedUserToDelete(user);
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
      const newSelecteds = SERVICELIST.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, userId) => {
    const selectedIndex = selected.indexOf(userId);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, userId);
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
  const deleteSelectedData = async () => {
    selected.forEach((documentId) => {
      if (documentId) {
        deleteDoc(doc(db, 'bookings', documentId))
          .then(() => {
            toast.info('Order with ID ' + documentId + ' deleted successfully!');
            // Additional handling if needed
          })
          .catch((error) => {
            toast.error('Error deleting Review with ID ' + documentId);
            console.error('Error deleting Review with ID ' + documentId, error);
            // Additional error handling if needed
          });
      }
    });
    setSelected([]);
  };
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - SERVICELIST.length) : 0;

  const filteredUsers = applySortFilter(SERVICELIST, getComparator(order, orderBy), filterName);

  const isNotFound = !filteredUsers.length && !!filterName;

  const onRefund = async (orderDetails) => {
    console.log('Stripe Secret:', process.env.REACT_APP_STRIPE_SECRET);

    try {
      const response = await axios.post(
        `https://api.stripe.com/v1/refunds`,
        {
          payment_intent: orderDetails.paymentId,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_STRIPE_SECRET}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      updateDoc(doc(db, 'bookings', orderDetails.id), { status: 'cancelled' })
        .then(() => {
          toast.success('Booking Canclled and refunded.');
          handleCloseDeleteDialog();
        })
        .catch((error) => {
          console.log(error);
          toast.error('Refunded Success but unable to update status.');
        });
      console.log('Refund successful:', response.data);
    } catch (error) {
      if (error.response.data.error.code == 'charge_already_refunded') {
        updateDoc(doc(db, 'bookings', orderDetails.id), { status: 'cancelled' });
        // .then(() => {
        //   toast.success('Booking Canclled and refunded.');
        //   handleCloseDeleteDialog();
        // })
        // .catch((error) => {
        //   console.log(error);
        //   toast.error('Refunded Success but unable to update status.');
        // });
      }
      toast.error('Error ' + error.response.data.error.message || 'Error try again.');
      console.error('Error refunding payment:', error.response ? error.response.data : error.message);
    }
  };

  return (
    <>
      <Helmet>
        <title> Bookings | BookMe </title>
      </Helmet>

      <Container>
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          heading="Delete Booking"
          subtitle="booking"
          docId={selectedUserToDelete?.id}
          email={selectedUserToDelete?.email}
          displayName={selectedUserToDelete?.userName}
          colName="bookings"
          onClose={handleCloseDeleteDialog}
        />

        <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
          <DialogTitle>Are you sure you want to cancel this booking?</DialogTitle>
          <DialogContent>
            <DialogContentText>Payment will be refunded to the user.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleCloseDeleteDialog()} color="primary">
              Cancel
            </Button>
            <Button onClick={() => onRefund(selectedUserToDelete)} color="error">
              Done
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={Boolean(openView)} onClose={handleCloseView} fullWidth maxWidth="sm">
          <DialogTitle>Service Details</DialogTitle>
          <DialogContent>
            {selectedUserToView && (
              <div className="row col-12 d-flex flex-wrap">
                <Typography variant="h6">{selectedUserToView?.title}</Typography>
                <Typography variant="body1">Id: {selectedUserToView?.id}</Typography>
                <br />
                <div className="col-sm-6">
                  <h3>Service Provider</h3>
                  <Typography variant="body1">Location: {selectedUserToView?.userData?.country}</Typography>
                  <Typography variant="body1">Provider: {selectedUserToView?.userData?.userName}</Typography>
                  <Typography variant="body1">Phone: {selectedUserToView?.userData?.phone}</Typography>
                  <Typography variant="body1">Email: {selectedUserToView?.userData?.email}</Typography>
                </div>
                <div className="col-sm-6">
                  <h3>Customer</h3>
                  <Typography variant="body1">Location: {selectedUserToView?.customerData?.country}</Typography>
                  <Typography variant="body1">Provider: {selectedUserToView?.customerData?.userName}</Typography>
                  <Typography variant="body1">Phone: {selectedUserToView?.customerData?.phone}</Typography>
                  <Typography variant="body1">Email: {selectedUserToView?.customerData?.email}</Typography>
                </div>

                <h3 class="mt-3">Booking Details</h3>
                {/* <div className="col">
                  <img src={selectedUserToView?.imageUrl} className="w-100" alt="" srcset="" />
                </div> */}
                <Typography variant="body1">Title: {selectedUserToView?.title}</Typography>
                <Typography variant="body1">Date: {selectedUserToView?.date}</Typography>
                <Typography variant="body1">Time: {selectedUserToView?.time}</Typography>
                <Typography variant="body1">Price: {selectedUserToView?.price}</Typography>
                <Typography variant="body1">Status: {selectedUserToView?.status}</Typography>

                <Typography variant="body1">
                  Booked On: {selectedUserToView?.createdOn?.toDate().toLocaleString()}
                </Typography>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseView} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom>
            All Bookings
          </Typography>

          <div>
            {/* <Button onClick={() => handleOpen()} variant="contained" startIcon={<Iconify icon="eva:plus-fill" />}>
              Add New review
            </Button> */}
          </div>
        </Stack>
        <Card>
          <UserListToolbar
            onDelete={() => deleteSelectedData()}
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
                  rowCount={SERVICELIST.length}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const {
                      userData,
                      price,
                      title,
                      category,
                      rating,
                      reviewsCount,
                      isFeatured,
                      id,
                      phone,
                      imageUrl,
                      customerData,
                      country,
                      date,
                      status,
                    } = row;
                    const selectedUser = selected.indexOf(id) !== -1;

                    return (
                      <TableRow hover key={id} tabIndex={-1} role="checkbox" selected={selectedUser}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedUser} onChange={(event) => handleClick(event, id)} />
                        </TableCell>
                        <TableCell align="left">${price}</TableCell>

                        <TableCell component="th" scope="row" padding="none">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <img height="40px" alt={title} src={imageUrl} />
                            <Typography variant="subtitle2" noWrap>
                              {title}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell component="th" scope="row" padding="none">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar alt={userData?.userName} src={userData?.imageUrl} />
                            <Typography variant="subtitle2" noWrap>
                              {userData?.userName}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell component="th" scope="row" padding="none">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar alt={customerData?.userName} src={customerData?.imageUrl} />
                            <Typography variant="subtitle2" noWrap>
                              {customerData?.userName}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="left">{customerData?.country}</TableCell>
                        <TableCell align="left">{date}</TableCell>
                        <TableCell align="left">
                          <Label color={status == 'pending' ? 'warning' : status == 'cancelled' ? 'error' : 'success'}>
                            {status}
                          </Label>
                        </TableCell>

                        <TableCell align="right">
                          <IconButton size="large" color="inherit" onClick={(event) => handleOpenMenu(event, row)}>
                            <Iconify icon={'eva:more-vertical-fill'} />
                          </IconButton>
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
            count={SERVICELIST.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 1,
            width: 140,
            '& .MuiMenuItem-root': {
              px: 1,
              typography: 'body2',
              borderRadius: 0.75,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleOpenView()} sx={{ mr: 2 }}>
          <Iconify icon={'carbon:view-filled'} sx={{ mr: 2 }} />
          View
        </MenuItem>

        <MenuItem onClick={() => handleOpenCancelDialog()} sx={{ color: 'error.main' }}>
          <Iconify icon={'ic:outline-cancel'} sx={{ mr: 2 }} />
          Cancel
        </MenuItem>
        <MenuItem onClick={() => handleOpenDeleteDialog()} sx={{ color: 'error.main' }}>
          <Iconify icon={'material-symbols:delete-outline'} sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>
    </>
  );
}
