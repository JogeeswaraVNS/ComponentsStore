import React, { useContext } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Dropdown from "react-bootstrap/Dropdown";
import { logincontext } from "../contextapi/contextapi";
import { useNavigate } from "react-router-dom";

function ProjectNavbar() {
  const [loginUser, setLoginUser] = useContext(logincontext); // Use logincontext as array
  const navigate = useNavigate();
  const logOut = () => {
    setLoginUser({}); // Clear user from context
    sessionStorage.removeItem("loginUser"); // Remove from localStorage
    navigate("/login"); // Redirect to login
  };

  return (
    <Navbar expand="lg" style={{ backgroundColor: "#03346E" }}>
      <Container>
        <Navbar.Brand className="text-white" style={{ fontFamily: "Lexend, sans-serif" }} href="/">
          COMPONENTS STORE
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          
          {/* Search By Dropdown */}
          <Dropdown>
            <Dropdown.Toggle id="dropdownMenuLink" className="px-3" style={{ backgroundColor: '#03346E', border: 'none', fontSize: '1.1rem' }}>
              Search By
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item href="/searchbyvendor">Vendor</Dropdown.Item>
              <Dropdown.Item href="/searchbycomponent">Component</Dropdown.Item>
              <Dropdown.Item href="/searchbyinvoice">Invoice</Dropdown.Item>
              <Dropdown.Item href="/searchbysuppliedto">Supplied To</Dropdown.Item>
              <Dropdown.Item href="/searchbydate">Date</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Navigation Links */}
          <Nav className="ms-auto">
            <Nav.Link className="text-white" href="/addcomponents">Add Components</Nav.Link>
          </Nav>

          {/* Authentication Links */}
          {!loginUser?.email ? (
            <>
              <Nav>
                <Nav.Link className="text-white" href="/login">Login</Nav.Link>
              </Nav>
            </>
          ) : (
            <Nav>
            <Nav.Link className="text-white" href="/signup">Add user</Nav.Link>
            <Dropdown>
              <Dropdown.Toggle className="px-3" style={{ backgroundColor: "#03346E", border: "none", fontSize: "1.1rem" }}>
                {loginUser.username}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={logOut}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default ProjectNavbar;
