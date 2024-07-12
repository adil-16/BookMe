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
// import USERLIST from '../_mock/user';

//Firebase
import { collection, getDoc, doc, deleteDoc, where, query, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { toast } from 'react-toastify';
// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'email', label: 'Email', alignRight: false },
  // { id: 'isVerified', label: 'Verified', alignRight: false },
  { id: 'phone', label: 'Phone No', alignRight: false },
  { id: 'country', label: 'Country', alignRight: false },
  { id: 'isDisabled', label: 'Account Status', alignRight: false },
  { id: 'withdrawnFunds', label: 'withdrawn', alignRight: false },
  { id: 'wallet', label: 'wallet', alignRight: false },
  { id: 'earnings', label: 'Earnings', alignRight: false },
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

  const [USERLIST, setUSERLIST] = useState([]);

  const [loading, setLoading] = useState(false); //To check if data if loaded or not from collection.

  useEffect(() => {
    const getData = async () => {
      setLoading(true);

      let collectionRef = collection(db, 'users');

      // Apply a where condition for the user role
      collectionRef = query(collectionRef, where('role', '==', 'service provider'));

      onSnapshot(collectionRef, (data) => {
        setUSERLIST([]);

        data.docs.forEach((doc) => {
          setUSERLIST((rows) => [...rows, { ...doc.data(), id: doc.id }]);
        });

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
      const newSelecteds = USERLIST.map((n) => n.id);
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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - USERLIST.length) : 0;

  const filteredUsers = applySortFilter(USERLIST, getComparator(order, orderBy), filterName);

  const isNotFound = !filteredUsers.length && !!filterName;
  const deleteSelectedData = async () => {
    selected.forEach((documentId) => {
      if (documentId) {
        const functions = getFunctions();
        const removeUserData = httpsCallable(functions, 'removeUserData');
        getDoc(doc(db, 'users', documentId)).then((user) => {
          removeUserData({ uid: documentId, email: user.data().email, displayName: user.data().userName })
            .then(() => {
              toast.info('User' + documentId + 'deleted successfully!');
            })
            .catch((error) => {
              toast.error('Error deleting user' + documentId);
              console.error('Error deleting User: ' + error);
            });
        });
      }
    });
    setSelected([]);
  };
  return (
    <>
      <Helmet>
        <title> Providers | BookMe </title>
      </Helmet>

      <Container>
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          heading="Delete User"
          subtitle="user"
          docId={selectedUserToDelete?.id}
          email={selectedUserToDelete?.email}
          displayName={selectedUserToDelete?.userName}
          colName="users"
          onClose={handleCloseDeleteDialog}
        />

        <Dialog open={Boolean(openView)} onClose={handleCloseView} fullWidth maxWidth="sm">
          <DialogTitle>Provider Details</DialogTitle>
          <DialogContent>
            {selectedUserToView && (
              <div className="row">
                <div className="col-sm-5">
                  <img src={selectedUserToView?.imageUrl} className="w-100" alt="" srcset="" />
                </div>
                <div className="col-sm-7">
                  <Typography variant="h6">{selectedUserToView?.userName}</Typography>
                  <Typography variant="body1">Id: {selectedUserToView?.id}</Typography>
                  <br />

                  <Typography variant="body1">Email: {selectedUserToView?.email}</Typography>
                  <Typography variant="body1">Wallet balance:${selectedUserToView?.wallet || 0}</Typography>
                  <Typography variant="body1">Total withdrawn:${selectedUserToView?.withdrawnFunds || 0}</Typography>
                  <Typography variant="body1">Role: {selectedUserToView?.role}</Typography>
                  <Typography variant="body1">Phone: {selectedUserToView?.phone}</Typography>
                  <Typography variant="body1">Address: {selectedUserToView?.address}</Typography>

                  <Typography variant="body1">
                    Joined On: {selectedUserToView?.createdOn?.toDate().toLocaleString()}
                  </Typography>
                </div>
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
            All Providers
          </Typography>
          <div>
            {/* <Link to="/dashboard/addadmin">
              <Button variant="contained" className="me-4" startIcon={<Iconify icon="eva:plus-fill" />}>
                New Admin
              </Button>
            </Link> */}
            {/* <Link to="/dashboard/adduser">
              <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />}>
                New User
              </Button>
            </Link> */}
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
                  rowCount={USERLIST.length}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const {
                      userName,
                      isOnline,
                      imageUrl,
                      id,
                      wallet,
                      withdrawnFunds,
                      phone,
                      isDisabled,
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

                        <TableCell component="th" scope="row" padding="none">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar alt={userName} src={imageUrl} />
                            <Typography variant="subtitle2" noWrap>
                              {userName}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell align="left">{email}</TableCell>
                        <TableCell align="left">{phone}</TableCell>
                        <TableCell align="left">{country}</TableCell>

                        {/* <TableCell align="left">{isVerified ? 'Yes' : 'No'}</TableCell> */}

                        <TableCell align="left">
                          <Label color={(isDisabled === true && 'error') || 'success'}>
                            {isDisabled ? 'Banned' : 'Active'}
                          </Label>
                        </TableCell>

                        <TableCell align="center">${withdrawnFunds || 0.0}</TableCell>
                        <TableCell align="center">${wallet || 0.0}</TableCell>
                        <TableCell align="center">
                          ${wallet && withdrawnFunds ? parseFloat(withdrawnFunds) + parseFloat(wallet) : 0.0}
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
            count={USERLIST.length}
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
