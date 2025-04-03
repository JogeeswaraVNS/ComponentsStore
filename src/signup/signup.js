import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

const Signup = () => {
  const { register, handleSubmit, reset } = useForm();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [userType, setUserType] = useState('user'); // Default value
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const normal = { border: '2px solid #ced4da' };
  const success = { border: '2px solid green' };
  const failure = { border: '2px solid red' };

  const checkEmail = (data) => {
    setEmail(data);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (data === '') setEmailError('*This field is required');
    else if (!emailRegex.test(data)) setEmailError('*Enter a valid email address');
    else setEmailError('');
  };

  const checkUsername = (data) => {
    setUsername(data);
    const usernameRegex = /^[a-zA-Z]{7,}$/;
    if (data === '') setUsernameError('*This field is required');
    else if (!usernameRegex.test(data)) setUsernameError('*Must be at least 7 letters with no digits or special characters');
    else setUsernameError('');
  };

  const checkPassword = (data) => {
    setPassword(data);
    if (data === '') setPasswordError('*This field is required');
    else {
      let charCount = 0, hasUppercase = false, hasSpecialChar = false, hasDigit = false;
      for (let char of data) {
        charCount++;
        if (char >= 'A' && char <= 'Z') hasUppercase = true;
        if ('!@#$%^&*'.includes(char)) hasSpecialChar = true;
        if (char >= '0' && char <= '9') hasDigit = true;
      }

      if (charCount < 8) setPasswordError('*Must contain at least 8 characters');
      else if (!hasUppercase) setPasswordError('*Must contain at least 1 uppercase letter');
      else if (!hasSpecialChar) setPasswordError('*Must contain at least 1 special character');
      else if (!hasDigit) setPasswordError('*Must contain at least 1 digit');
      else setPasswordError('');
    }
  };

  const checkConfirmPassword = (data) => {
    setConfirmPassword(data);
    if (data === '') setConfirmPasswordError('*This field is required');
    else if (data !== password) setConfirmPasswordError('*Passwords do not match');
    else setConfirmPasswordError('');
  };

  const handleClose = () => {
    setShowModal(false);
    if (modalMessage === '✅ Account created successfully!') {
      navigate('/');
    } else {
      reset();
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const submitForm = (formData) => {
    let isValid = !emailError && email !== '' && !usernameError && username !== '' && !passwordError && password !== '' && !confirmPasswordError && confirmPassword === password;

    if (isValid) {
      const finalData = { ...formData, userType }; // Include userType in submission

      axios
        .post('http://127.0.0.1:5000/signup', finalData)
        .then((response) => {
          if (response.status === 201) {
            setModalMessage('✅ Account created successfully!');
            setShowModal(true);
          }
        })
        .catch((error) => {
          if (error.response && error.response.status === 400) {
            setModalMessage('❌ User with this email already exists');
            setShowModal(true);
          } else {
            console.error('Error in registration:', error);
          }
        });
    }
  };

  return (
    <div style={{ height: '90vh' }} className="container d-flex align-items-center justify-content-center">
      <div className="col-md-6 col-lg-5 col-sm-8">
        <form className="border p-4 rounded shadow bg-white" autoComplete="off" onSubmit={handleSubmit(submitForm)}>
          <h3 className="text-center mb-3">Please Register Here:</h3>

          {/* Email Field */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label"><b>Email</b></label>
            <input type="email" className="form-control" id="email" required {...register('email')} value={email} onChange={(e) => checkEmail(e.target.value)} style={emailError ? failure : email.length > 0 ? success : normal} />
            {emailError && <span className="text-danger">{emailError}</span>}
          </div>

          {/* Username Field */}
          <div className="mb-3">
            <label htmlFor="username" className="form-label"><b>Username</b></label>
            <input type="text" className="form-control" id="username" required {...register('username')} value={username} onChange={(e) => checkUsername(e.target.value)} style={usernameError ? failure : username.length >= 7 ? success : normal} />
            {usernameError && <span className="text-danger">{usernameError}</span>}
          </div>

          {/* Password Field */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label"><b>Password</b></label>
            <input type="password" className="form-control" id="password" required {...register('password')} value={password} onChange={(e) => checkPassword(e.target.value)} style={passwordError ? failure : password.length >= 8 ? success : normal} />
            {passwordError && <span className="text-danger">{passwordError}</span>}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label"><b>Confirm Password</b></label>
            <input type="password" className="form-control" id="confirmPassword" required {...register('confirmPassword')} value={confirmPassword} onChange={(e) => checkConfirmPassword(e.target.value)} style={confirmPasswordError ? failure : confirmPassword && confirmPassword === password ? success : normal} />
            {confirmPasswordError && <span className="text-danger">{confirmPasswordError}</span>}
          </div>

          {/* User Type Dropdown */}
          <div className="mb-3">
            <label htmlFor="userType" className="form-label"><b>User Type</b></label>
            <select className="form-control" id="userType" {...register('userType')} value={userType} onChange={(e) => setUserType(e.target.value)}>
              <option value="user">User</option>
              <option value="superuser">Superuser</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-2">Create Account</button>
        </form>
      </div>

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

export default Signup;
