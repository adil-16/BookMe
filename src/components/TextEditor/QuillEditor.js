import React, { useRef, useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import the CSS for the editor styles
import { app } from "../../firebase";
import Quill from "quill";
import { LinearProgress } from "@mui/material";
const BlockEmbed = Quill.import("blots/block/embed");
class VideoBlot extends BlockEmbed {
  static create(value) {
    const node = super.create();
    node.setAttribute("controls", true);
    node.setAttribute("src", value);
    return node;
  }

  static value(node) {
    return node.getAttribute("src");
  }
}

VideoBlot.blotName = "video";
VideoBlot.tagName = "video";

Quill.register(VideoBlot);
const QuillEditor = ({ value, onChange }) => {
  const quillRef = useRef(null);
  const [content, setContent] = useState();
  useEffect(() => {
    setContent(value);
  }, [value]);

  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);

  useEffect(() => {
    if (quillRef.current) {
      const quillInstance = quillRef.current.getEditor();
      if (quillInstance) {
        quillInstance
          .getModule("toolbar")
          .addHandler("image", handleImageInsertion);
        quillInstance
          .getModule("toolbar")
          .addHandler("video", handleVideoInsertion);
        quillInstance
          .getModule("toolbar")
          .addHandler("clean", handleFileInsertion); // Add custom file handler
      }
    }
  }, []);
  const handleFileInsertion = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf"; // Accepted file types
    fileInput.addEventListener("change", (event) => {
      setSelectedFiles(Array.from(event.target.files));
    });
    fileInput.click();
  };

  const handleImageInsertion = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;

    fileInput.addEventListener("change", (event) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        setSelectedPhotos(Array.from(files));
      }
    });

    fileInput.click();
  };
  const handleVideoInsertion = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";
    fileInput.multiple = true;

    fileInput.addEventListener("change", (event) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        setSelectedVideos(Array.from(files)); // Update the selectedVideos state, not selectedPhotos
      }
    });

    fileInput.click();
  };

  const doUploadPhotos = async () => {
    setUploadingFile(true);
    const storageRef = app.storage().ref("Course_Photos");
    const uploadTasks = selectedPhotos.map((file) => {
      const fileName = `${Date.now()}_${file.name}`;
      setUploadFileName(file.name);
      const uploadTask = storageRef.child(fileName).put(file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(progress);
        },
        (error) => {
          console.error("Error uploading file:", error);
        }
      );
      return uploadTask;
    });

    // Wait for all upload tasks to complete
    const snapshots = await Promise.all(
      uploadTasks.map((uploadTask) => uploadTask)
    );

    // Get the download URLs for all uploaded Photos
    const fileUrls = await Promise.all(
      snapshots.map((snapshot) => snapshot.ref.getDownloadURL())
    );

    // Reset the progress bar state
    setUploadingFile(false);
    setUploadProgress(0);
    setUploadFileName("");

    // Continue with the rest of the code
    // ...

    // Clear the selected Photos array
    setSelectedPhotos([]);

    return fileUrls;
  };
  const doUploadVideos = async () => {
    setUploadingFile(true);
    const storageRef = app.storage().ref("Course_Videos");
    const uploadTasks = selectedVideos.map((file) => {
      const fileName = `${Date.now()}_${file.name}`;
      setUploadFileName(file.name);
      const uploadTask = storageRef.child(fileName).put(file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(progress);
        },
        (error) => {
          console.error("Error uploading file:", error);
        }
      );
      return uploadTask;
    });

    // Wait for all upload tasks to complete
    const snapshots = await Promise.all(
      uploadTasks.map((uploadTask) => uploadTask)
    );

    // Get the download URLs for all uploaded Videos
    const fileUrls = await Promise.all(
      snapshots.map((snapshot) => snapshot.ref.getDownloadURL())
    );

    // Reset the progress bar state
    setUploadingFile(false);
    setUploadProgress(0);
    setUploadFileName("");

    // Continue with the rest of the code
    // ...

    // Clear the selected Videos array
    setSelectedVideos([]);

    return fileUrls;
  };
  const doUploadFiles = async () => {
    setUploadingFile(true);
    const storageRef = app.storage().ref("Course_Files");
    const uploadTasks = selectedFiles.map((file) => {
      const fileName = `${Date.now()}_${file.name}`;
      setUploadFileName(file.name);
      const uploadTask = storageRef.child(fileName).put(file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log(progress);
        },
        (error) => {
          console.error("Error uploading file:", error);
        }
      );
      return uploadTask;
    });

    // Wait for all upload tasks to complete
    const snapshots = await Promise.all(
      uploadTasks.map((uploadTask) => uploadTask)
    );

    // Get the download URLs for all uploaded files
    const fileUrls = await Promise.all(
      snapshots.map((snapshot) => snapshot.ref.getDownloadURL())
    );

    // Reset the progress bar state
    setUploadingFile(false);
    setUploadProgress(0);
    setUploadFileName("");

    // Continue with the rest of the code
    // ...

    // Clear the selected files array
    setSelectedFiles([]);

    return fileUrls;
  };

  useEffect(() => {
    // Perform the image upload and insertion when selectedPhotos state changes
    const insertImages = async () => {
      if (selectedPhotos.length > 0) {
        const uploadedPhotoUrls = await doUploadPhotos();

        // Get the Quill editor instance
        const editor = quillRef.current.getEditor();

        // Insert the images using the built-in Quill image handler
        uploadedPhotoUrls.forEach((url) => {
          const range = editor.getSelection();
          editor.insertEmbed(range.index, "image", url);
          editor.setSelection(range.index + 1); // Move the cursor to the next position
        });

        // Clear the selected photos array
        setSelectedPhotos([]);
      }
    };

    insertImages();
  }, [selectedPhotos]);
  useEffect(() => {
    // Perform the video upload and insertion when selectedVideos state changes
    const insertVideos = async () => {
      if (selectedVideos.length > 0) {
        const uploadedVideoUrls = await doUploadVideos();

        // Get the Quill editor instance
        const editor = quillRef.current.getEditor();

        // Insert the videos using the custom video blot
        uploadedVideoUrls.forEach((url) => {
          editor.insertEmbed(editor.getSelection().index, "video", url);
        });

        // Clear the selected Videos array
        setSelectedVideos([]);
      }
    };

    insertVideos();
  }, [selectedVideos]);
  useEffect(() => {
    // Perform the file upload and insertion when selectedFiles state changes
    const insertFiles = async () => {
      if (selectedFiles.length > 0) {
        const uploadedFileUrls = await doUploadFiles();

        // Get the Quill editor instance
        const editor = quillRef.current.getEditor();

        // Insert the file links using the built-in Quill link handler
        uploadedFileUrls.forEach((url, index) => {
          const range = editor.getSelection();
          const fileName = selectedFiles[index].name;
          const link = url;
          editor.insertText(range.index, fileName, "link", link, true);
          editor.setSelection(range.index + fileName.length); // Move the cursor to the next position
        });

        // Clear the selected files array
        setSelectedFiles([]);
      }
    };

    insertFiles();
  }, [selectedFiles]);
  const handleChange = (value) => {
    setContent(value);
    onChange(value);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["image"], // Move "image" option to its own group
      ["video"],

      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "script",
    "bullet",
    "indent",
    "direction",
    "color",
    "background",
    "link",
    "image",
    "video",
    "clean",
  ];
  const handleFileButtonClick = () => {
    handleFileInsertion();
  };
  return (
    <>
      <div>
        {uploadingFile && (
          <>
            <p>Uploading : {uploadFileName}</p>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              style={{ marginTop: "10px" }}
            />
          </>
        )}
        {/* <button
          className="btn btn-sm btn-primary"
          onClick={handleFileButtonClick}
        >
          <b>+</b> File
        </button> */}
        <ReactQuill
          ref={quillRef}
          value={content}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          style={{ height: "500px" }}
        />
      </div>
    </>
  );
};

export default QuillEditor;
