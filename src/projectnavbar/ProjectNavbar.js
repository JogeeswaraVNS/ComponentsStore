import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";

function ProjectNavbar() {
  const [show, setShow] = useState(false);
  const handleMouseEnter = () => {
    setShow(true);
  };

  const handleMouseLeave = () => {
    setShow(false);
  };
  return (
    <div>
      <div>
        <Navbar expand="lg" style={{ backgroundColor: "#03346E" }}>
          <Container>
            <Navbar.Brand
              className="text-white"
              style={{ fontFamily: "Lexend, sans-serif" }}
              href="/"
            >
              COMPONENTS STORE
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Dropdown
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                show={show}
              >
                <Dropdown.Toggle
                  id="dropdownMenuLink"
                  className="px-3"
                  style={{backgroundColor:'#03346E',border:'none',fontSize:'1.1rem'}}
                  aria-expanded="false"
                >
                  Search By
                </Dropdown.Toggle>

                <Dropdown.Menu aria-labelledby="dropdownMenuLink">
                  <Dropdown.Item href="/searchbyvendor">Vendor</Dropdown.Item>
                  <Dropdown.Item href="/searchbycomponent">
                    Component
                  </Dropdown.Item>
                  <Dropdown.Item href="/searchbyinvoice">Invoice</Dropdown.Item>
                  <Dropdown.Item href="/searchbysuppliedto">
                    Supplied To
                  </Dropdown.Item>
                  <Dropdown.Item href="/searchbydate">Date</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Nav className="ms-auto">
                <Nav.Link className="text-white" href="/addcomponents">
                  Add Components
                </Nav.Link>
              </Nav>
              <Nav className="">
                <Nav.Link className="text-white" href="/history">
                  History
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </div>
    </div>
  );
}

export default ProjectNavbar;
