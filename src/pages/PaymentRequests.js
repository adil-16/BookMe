import { Helmet } from 'react-helmet-async';
import { filter, toInteger } from 'lodash';
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
  OutlinedInput,
} from '@mui/material';

import { Link } from 'react-router-dom';

// components
import Label from '../components/label';
import Iconify from '../components/iconify';
import Scrollbar from '../components/scrollbar';

// sections
import { UserListHead, UserListToolbar } from '../sections/@dashboard/user';

//Firebase
import { collection, getDoc, updateDoc, doc, deleteDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import axios from 'axios';

import { toast } from 'react-toastify';

import { styled, alpha } from '@mui/material/styles';
// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'price', label: 'Name', alignRight: false },
  { id: 'amount', label: 'Amount', alignRight: false },
  { id: 'country', label: 'Country', alignRight: false },
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
        _user.userData.userName.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        _user.userData.email.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        _user.userData.phone.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }
  return stabilizedThis.map((el) => el[0]);
}

export default function PaymentRequests() {
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

  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const getData = async () => {
      const collectionRef = collection(db, 'paymentRequests');

      try {
        const unsubscribe = onSnapshot(collectionRef, async (querySnapshot) => {
          // Handle each snapshot change
          const userPromises = querySnapshot.docs.map(async (document) => {
            const reviewData = document.data();
            const providerId = reviewData.providerId;
            const bankId = reviewData.bankId;

            // Check if providerId and bankId are not null or undefined
            if (!providerId || !bankId) {
              console.warn('Invalid providerId or bankId in document:', document.id);
              return null;
            }

            const userDocRef = doc(db, 'users', providerId);
            const bankDocRef = doc(db, 'bankAccounts', bankId);

            // Use Promise.all to wait for both promises
            const [providerSnapshot, bankSnapshot] = await Promise.all([getDoc(userDocRef), getDoc(bankDocRef)]);

            return {
              bookingId: document.id,
              reviewData: { ...reviewData, id: document.id },
              providerData: providerSnapshot.exists() ? providerSnapshot.data() : null,
              bankData: bankSnapshot.exists() ? bankSnapshot.data() : null,
            };
          });

          // Filter out any null results
          const resolvedData = await Promise.all(userPromises);
          const filteredData = resolvedData.filter((data) => data !== null);

          // Map the filtered data to create the new service list
          const newServiceList = filteredData.map(({ bookingId, reviewData, providerData, bankData }) => {
            const mergedData = {
              ...reviewData,
              id: bookingId,
              userData: providerData,
              bankData,
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
        deleteDoc(doc(db, 'paymentRequests', documentId))
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

  const onRefund = async (orderDetails, todo) => {
    if (todo == 'reject') {
      updateDoc(doc(db, 'paymentRequests', orderDetails.id), {
        status: 'cancelled',
        reason: rejectReason ? rejectReason : '',
      })
        .then(() => {
          toast.success('Request Rejected!');
          handleCloseDeleteDialog();
        })
        .catch((error) => {
          console.log(error);
          toast.error('Refunded Success but unable to update status.');
        });
    }
    if (todo == 'accept') {
      console.log('orderdetails herea are : ', orderDetails);
      if (toInteger(orderDetails.amount) <= toInteger(orderDetails?.userData.wallet)) {
        console.log('yes gud amount of funds');
        updateDoc(doc(db, 'paymentRequests', orderDetails.id), { status: 'completed', reason: '' })
          .then(async () => {
            const currentWithdrawnBalnace = toInteger(orderDetails?.userData.withdrawnFunds);
            const newBalance = toInteger(orderDetails?.userData.wallet) - toInteger(orderDetails.amount);
            const withdrawnFunds = currentWithdrawnBalnace + toInteger(orderDetails.amount);
            await updateDoc(doc(db, 'users', orderDetails?.userData?.id), {
              wallet: newBalance,
              withdrawnFunds: withdrawnFunds,
            });
            toast.success('Request Completed!');
            handleCloseCancelDialog();
            window.location.reload();
          })
          .catch((error) => {
            console.log(error);
            toast.error('Refunded Success but unable to update status.');
          });
      } else {
        console.log(' not enough finds');
        toast.error('Not Enough Funds');
        handleCloseCancelDialog();
      }
    }
  };

  return (
    <>
      <Helmet>
        <title> Bookings | BookMe </title>
      </Helmet>

      <Container>
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Are you sure you want to reject this Request?</DialogTitle>
          <DialogContent>
            <DialogContentText>Enter the reason below</DialogContentText>
            <input
              type="text"
              value={rejectReason}
              placeholder="Reason"
              style={{ outline: 'none', width: '100%', padding: '0.5rem', borderRadius: 5, border: '1px solid grey' }}
              onChange={(e) => {
                setRejectReason(e.target.value);
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                handleCloseDeleteDialog();
              }}
              color="primary"
            >
              Cancel
            </Button>
            <Button onClick={() => onRefund(selectedUserToDelete, 'reject')} color="error">
              Done
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
          <DialogTitle>Are you sure you want to accept this Request?</DialogTitle>
          <DialogContent>
            <DialogContentText>Payment Request will be accepted</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                handleCloseCancelDialog();
              }}
              color="primary"
            >
              Cancel
            </Button>
            <Button onClick={() => onRefund(selectedUserToDelete, 'accept')} color="error">
              Done
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={Boolean(openView)} onClose={handleCloseView} fullWidth maxWidth="sm">
          <DialogTitle>Request Details</DialogTitle>
          <DialogContent>
            {selectedUserToView && (
              <div className="row col-12 d-flex flex-wrap">
                <Typography variant="h6">{selectedUserToView?.title}</Typography>
                <Typography variant="body1">Id: {selectedUserToView?.id}</Typography>
                <br />
                <div className="col-sm-6">
                  <h3>Provider Details</h3>
                  <Typography variant="body1">Provider: {selectedUserToView?.userData?.userName}</Typography>
                  <Typography variant="body1">Phone: {selectedUserToView?.userData?.phone}</Typography>
                  <Typography variant="body1">Email: {selectedUserToView?.userData?.email}</Typography>
                </div>
                <div className="col-sm-6">
                  <h3>Bank Details</h3>
                  <Typography variant="body1">
                    Account Holder: {selectedUserToView?.bankData?.bankAccountHolder}
                  </Typography>
                  <Typography variant="body1">
                    Account Number: {selectedUserToView?.bankData?.bankAccountNumber}
                  </Typography>
                  <Typography variant="body1">Location: {selectedUserToView?.bankData?.country}</Typography>
                  <Typography variant="body1">Currency: {selectedUserToView?.bankData?.currency}</Typography>
                </div>

                <h3 class="mt-3">Request Details</h3>
                <Typography variant="body1">Date: {selectedUserToView?.date}</Typography>
                <Typography variant="body1">Price: ${selectedUserToView?.amount}</Typography>
                <Typography variant="body1">Status: {selectedUserToView?.status}</Typography>
                {selectedUserToView?.reason ? (
                  <Typography variant="body1">Reason: {selectedUserToView?.reason}</Typography>
                ) : (
                  <></>
                )}
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
            Payment Requests
          </Typography>
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
                    console.log(row);
                    const {
                      userData,
                      price,
                      reason,
                      amount,
                      title,
                      category,
                      rating,
                      reviewsCount,
                      isFeatured,
                      id,
                      phone,
                      imageUrl,
                      bankData,
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
                            <Typography variant="subtitle2" noWrap>
                              $ {amount}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="left">{bankData?.country}</TableCell>
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
        <MenuItem onClick={() => handleOpenCancelDialog()} sx={{ color: 'success.main' }}>
          <Iconify icon={'teenyicons:tick-circle-outline'} sx={{ mr: 2 }} />
          Accept
        </MenuItem>
        <MenuItem onClick={() => handleOpenDeleteDialog()} sx={{ color: 'error.main' }}>
          <Iconify icon={'ic:outline-cancel'} sx={{ mr: 2 }} />
          Decline
        </MenuItem>
      </Popover>
    </>
  );
}
