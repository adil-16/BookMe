const admin = require('firebase-admin');
admin.initializeApp();
const functions = require('firebase-functions');

exports.makeAdmin = functions.https.onRequest(async (req, res) => {
  try {
    // Extract the UID from the request query parameters or body
    // res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    const uid = req.query.uid || req.body.uid;

    if (!uid) {
      throw new Error('UID is missing in the request.');
    }

    // Set the custom claims to make the user an admin
    await admin.auth().setCustomUserClaims(uid, { admin: true });

    // Respond with a success message
    res.status(200).send('User is now an admin.');
  } catch (error) {
    // Handle errors and send an error response
    console.error('Error:', error);
    res.status(500).send('Error: ' + error.message);
  }
});
exports.removeAdmin = functions.https.onCall((data, context) => {
  return admin
    .auth()
    .setCustomUserClaims(data.uid, { admin: false })
    .catch((error) => {
      throw new functions.https.HttpsError('internal', error.message);
    });
});
exports.getUserData = functions.https.onCall((data, context) => {
  return admin
    .auth()
    .getUser(data.uid)
    .then((userRecord) => {
      return userRecord;
    })
    .catch((error) => {
      throw new functions.https.HttpsError('internal', error.message);
    });
});

exports.removeUserData = functions.https.onCall(async (data, context) => {
  try {
    // Validate that the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
    }
    // Get the user's UID and data from the request body
    const { uid } = data;
    console.log('data', data);
    // Delete the user from Firebase Authentication
    await admin.auth().deleteUser(uid);

    // Delete the user's document from the 'users' collection
    await admin.firestore().collection('users').doc(uid).delete();
    // Query the 'listings' collection for documents where 'userId' is equal to 'uid'
    const querySnapshot = await admin.firestore().collection('services').where('userId', '==', uid).get();

    // Delete each matching document
    querySnapshot.forEach((doc) => {
      doc.ref.delete();
    });
    const querySnapshot1 = await admin.firestore().collection('services').where('providerId', '==', uid).get();

    // Delete each matching document
    querySnapshot1.forEach((doc) => {
      doc.ref.delete();
    });
    const eventSnapshot = await admin.firestore().collection('reviews').where('userId', '==', uid).get();

    // Delete each matching document
    eventSnapshot.forEach((doc) => {
      doc.ref.delete();
    });
    const service = await admin.firestore().collection('reviews').where('providerId', '==', uid).get();

    // Delete each matching document
    service.forEach((doc) => {
      doc.ref.delete();
    });
    const report = await admin.firestore().collection('bookings').where('userId', '==', uid).get();

    // Delete each matching document
    report.forEach((doc) => {
      doc.ref.delete();
    });
    const jobs = await admin.firestore().collection('bookings').where('providerId', '==', uid).get();

    // Delete each matching document
    jobs.forEach((doc) => {
      doc.ref.delete();
    });

    return { msg: 'User Deleted successfully' };
  } catch (error) {
    console.error(error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.disableUser = functions.https.onCall((data, context) => {
  // Get the user's UID and data from the request body
  return admin
    .auth()
    .updateUser(data.uid, { disabled: data.status })
    .then(() => {
      return admin
        .firestore()
        .collection('users')
        .doc(data.uid)
        .update({ disabled: data.status })
        .then((user) => {
          return user;
        })
        .catch((error) => {
          throw new functions.https.HttpsError('internal', error.message);
        });
    })
    .catch((error) => {
      throw new functions.https.HttpsError('internal', error.message);
    });
});

exports.addUser = functions.https.onCall((data, context) => {
  return admin
    .auth()
    .createUser(data)
    .then((user) => {
      return user;
    })
    .catch((error) => {
      throw new functions.https.HttpsError('internal', error.message);
    });
});

exports.updateUserData = functions.https.onCall((data, context) => {
  // Get the user's UID and data from the request body
  return admin
    .auth()
    .updateUser(data.uid, {
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
    })
    .then((user) => {
      return user;
    })
    .catch((error) => {
      throw new functions.https.HttpsError('internal', error.message);
    });
});
exports.sendPushNotificationToUser = functions.https.onCall(async (data, context) => {
  // Validate that the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
  }

  // Validate that the required parameters are provided
  if (!data.token || !data.title || !data.body) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with the "token", "title", and "body" arguments.'
    );
  }

  // Create a message object to send to the specified token
  const message = {
    token: data.token,
    notification: {
      title: data.title,
      body: data.body,
    },
  };

  try {
    // Send the push notification
    await admin.messaging().send(message);

    // Add the notification data to the "notifications" collection
    const notificationData = {
      userId: data.userId, // Add the userId from the request body
      title: data.title,
      body: data.body,
      sentDateTime: admin.firestore.FieldValue.serverTimestamp(), // Add the current timestamp
    };

    await admin.firestore().collection('notifications').add(notificationData);

    console.log(`Push notification sent to user with token ${data.token}`);
    return { result: `Push notification sent to user with token ${data.token}` };
  } catch (error) {
    console.log(error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.sendPushNotificationToTopic = functions.https.onCall(async (data, context) => {
  // Validate that the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('failed-precondition', 'The function must be called while authenticated.');
  }

  // Validate that the required parameters are provided
  if (!data.topic || !data.message.notification.title || !data.message.notification.body) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with the "topic", "title", and "body" arguments.'
    );
  }

  // Create a message object to send to the specified topic
  const message = {
    topic: data.topic,
    data: {
      title: data.message.notification.title,
      body: data.message.notification.body,
      imageUrl: data.message.data.imageUrl,
    },
  };

  try {
    // Send the push notification to the topic
    await admin.messaging().send(message);

    console.log(`Push notification sent  ${message.data.imageUrl}`);
    return { result: `Push notification sent  ${message}` };
  } catch (error) {
    console.log(error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
