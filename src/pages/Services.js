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
import { collection, getDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { toast } from 'react-toastify';
// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'price', label: 'Price', alignRight: false },
  { id: 'service', label: 'Service Title', alignRight: false },
  // { id: 'isVerified', label: 'Verified', alignRight: false },
  { id: 'postedby', label: 'Posted By', alignRight: false },
  { id: 'location', label: 'Location', alignRight: false },
  { id: 'category', label: 'Category', alignRight: false },
  { id: 'isFeatured', label: 'Featured', alignRight: false },
  { id: 'rattings', label: 'Rattings', alignRight: false },
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

  const [selectedUserToDelete, setSelectedUserToDelete] = useState(null);

  const [selectedUserToView, setSelectedUserToView] = useState(null);

  const [SERVICELIST, setSERVICELIST] = useState([]);

  const [loading, setLoading] = useState(false); //To check if data if loaded or not from collection.

  useEffect(() => {
    const getData = async () => {
      // Inside your component or function
      const collectionRef = collection(db, 'services');
      onSnapshot(collectionRef, async (data) => {
        setSERVICELIST([]);
        const newServiceList = [];

        for (const docs of data.docs) {
          const reviewData = docs.data();
          const providerId = reviewData.providerId;

          // Reference the user document using the UID
          const userDocRef = doc(db, 'users', providerId);

          try {
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists()) {
              // Merge user data with review data
              const userData = userDocSnapshot.data();
              const reviewWithUserData = { ...reviewData, id: docs.id, userData };
              newServiceList.push(reviewWithUserData);
            } else {
              // If user document doesn't exist, just add review data with no user data
              newServiceList.push({ ...reviewData, id: docs.id });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
        setSERVICELIST(newServiceList);
        setLoading(false);
      });
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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - SERVICELIST.length) : 0;

  const filteredUsers = applySortFilter(SERVICELIST, getComparator(order, orderBy), filterName);

  const isNotFound = !filteredUsers.length && !!filterName;
  const deleteSelectedData = async () => {
    selected.forEach((documentId) => {
      if (documentId) {
        deleteDoc(doc(db, 'services', documentId))
          .then(() => {
            toast.info('Service with ID ' + documentId + ' deleted successfully!');
            // Additional handling if needed
          })
          .catch((error) => {
            toast.error('Error deleting Service with ID ' + documentId);
            console.error('Error deleting Service with ID ' + documentId, error);
            // Additional error handling if needed
          });
      }
    });
  };

  const handleFeaturedChange = (id, isFeatured) => {
    updateDoc(doc(db, 'services', id), { isFeatured: !isFeatured })
      .then(() => {
        if (isFeatured) {
          toast.info('Service Removed From Featured');
        } else {
          toast.success('Service Added To Featured');
        }
      })
      .catch((error) => {
        toast.error('Error. Try Again');
        console.log(error);
      });
  };
  return (
    <>
      <Helmet>
        <title> Services | BookMe </title>
      </Helmet>

      <Container>
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          heading="Delete Service"
          subtitle="service"
          docId={selectedUserToDelete?.id}
          email={selectedUserToDelete?.email}
          displayName={selectedUserToDelete?.userName}
          colName="services"
          onClose={handleCloseDeleteDialog}
        />

        <Dialog open={Boolean(openView)} onClose={handleCloseView} fullWidth maxWidth="sm">
          <DialogTitle>Service Details</DialogTitle>
          <DialogContent>
            {selectedUserToView && (
              <div className="row">
                <div className="col-sm-5">
                  <img src={selectedUserToView?.imageUrl} className="w-100" alt="" srcset="" />
                </div>
                <div className="col-sm-7">
                  <Typography variant="h6">{selectedUserToView?.title}</Typography>
                  <Typography variant="body1">Id: {selectedUserToView?.id}</Typography>
                  <br />
                  <h3>Service Provider</h3>
                  <Typography variant="body1">Location: {selectedUserToView?.userData?.country}</Typography>
                  <Typography variant="body1">Provider: {selectedUserToView?.userData?.userName}</Typography>
                  <Typography variant="body1">Phone: {selectedUserToView?.userData?.phone}</Typography>
                  <Typography variant="body1">Email: {selectedUserToView?.userData?.email}</Typography>

                  <h3 class="mt-3">Service Details</h3>
                  <Typography variant="body1">Price: {selectedUserToView?.price}</Typography>
                  <Typography variant="body1">Title: {selectedUserToView?.title}</Typography>
                  <Typography variant="body1">Category: {selectedUserToView?.category}</Typography>
                  <Typography variant="body1">Hours: {selectedUserToView?.hours}</Typography>
                  <Typography variant="body1">Minutes: {selectedUserToView?.minutes}</Typography>
                  <Typography variant="body1">Location: {selectedUserToView?.location}</Typography>
                  <Typography variant="body1">Is Featured: {selectedUserToView?.isFeatured ? 'Yes' : 'No'}</Typography>
                  <Typography variant="body1">Reviews: {selectedUserToView?.reviewsCount}</Typography>
                  <Typography variant="body1">Ratting: {selectedUserToView?.rating}</Typography>
                  <Typography variant="body1">
                    Posted On: {selectedUserToView?.createdOn?.toDate().toLocaleString()}
                  </Typography>
                </div>
                <p>
                  <b>Description: </b>
                  {selectedUserToView?.description}
                </p>
                {/* Add more user details here */}
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
            All Services
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
                      country,
                      role,
                      email,
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

                        <TableCell align="left">{userData?.country}</TableCell>
                        <TableCell align="left">{category}</TableCell>
                        <TableCell align="left">
                          <Switch checked={isFeatured} onChange={() => handleFeaturedChange(id, isFeatured)} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" noWrap>
                            <Iconify className="me-2" icon="fluent-emoji-flat:star" />
                            {rating} ({reviewsCount})
                          </Typography>
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

        <MenuItem onClick={() => handleOpenDeleteDialog()} sx={{ color: 'error.main' }}>
          <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>
    </>
  );
}
