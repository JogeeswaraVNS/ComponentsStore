import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import { useContext } from "react";
import { logincontext } from "../contextapi/contextapi";

const Login = () => {
  const { register, handleSubmit } = useForm();

  const [,setLoginUser] = useContext(logincontext);

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [modalMessage, setModalMessage] = useState(""); // State for modal messages
  const [showModal, setShowModal] = useState(false);

  // Validation Styles
  const normal = { border: "2px solid #ced4da" };
  const success = { border: "2px solid green" };
  const failure = { border: "2px solid red" };

  // Email Validation
  const checkEmail = (data) => {
    setEmail(data);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (data === "") {
      setEmailError("*This field is required");
    } else if (!emailRegex.test(data)) {
      setEmailError("*Enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  // Password Validation (Minimum 8 characters)
  const checkPassword = (data) => {
    setPassword(data);
    if (data.length < 8) {
      setPasswordError("*Password must be at least 8 characters");
    } else {
      setPasswordError("");
    }
  };

  // Handle Modal Close
  const handleClose = () => {
    setShowModal(false);
    if (modalMessage === "✅ Login successful!") {
      navigate("/"); // Navigate to home on success
    } else {
      setEmail("");
      setPassword("");
    }
  };

  // Form Submission
  const submitForm = async (formData) => {
    if (!emailError && email !== "" && !passwordError && password.length >= 8) {
      try {
        const response = await axios.post("http://127.0.0.1:5000/login", formData);

        if (response.status === 200) {
          setLoginUser(response.data.user);

        // Store user data in localStorage
          sessionStorage.setItem("loginUser", JSON.stringify(response.data.user));
          setModalMessage("✅ Login successful!");
          setShowModal(true);
        }
      } catch (error) {
        if (error.response) {
          // Check for specific status codes
          if (error.response.status === 401) {
            setModalMessage("❌ Wrong password!");
          } else if (error.response.status === 404) {
            setModalMessage("❌ User with this email does not exist!");
          } else {
            setModalMessage("❌ Error logging in. Please try again.");
          }
        } else {
          // Handle network errors or no response from server
          setModalMessage("❌ Unable to connect to the server.");
        }
        setShowModal(true);
        console.error("Login error:", error);
      }
    }
  };

  return (
    <div className="container vh-100 d-flex align-items-center justify-content-center">
      <div className="col-md-6 col-lg-5 col-sm-8">
        <form
          className="border p-4 rounded shadow bg-white"
          autoComplete="off"
          onSubmit={handleSubmit(submitForm)}
        >
          <h3 className="text-center mb-3">Login Here:</h3>

          {/* Email */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              <b>Email</b>
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              required
              {...register("email")}
              value={email}
              onChange={(e) => checkEmail(e.target.value)}
              style={emailError ? failure : email.length > 0 ? success : normal}
            />
            {emailError && <span className="text-danger">{emailError}</span>}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              <b>Password</b>
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              required
              {...register("password")}
              value={password}
              onChange={(e) => checkPassword(e.target.value)}
              style={passwordError ? failure : password.length >= 8 ? success : normal}
            />
            {passwordError && <span className="text-danger">{passwordError}</span>}
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>

      {/* Modal for Messages */}
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Body className="text-center">
          <h5>{modalMessage}</h5>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button variant="primary" onClick={handleClose}>OK</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Login;