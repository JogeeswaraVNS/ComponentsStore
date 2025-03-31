import React, { useEffect, useState,useContext } from "react";
import { useSpring, animated } from "@react-spring/web";
import { logincontext } from "../contextapi/contextapi";
import axios from "axios";

function HomePage() {

  const [loginUser, setLoginUser] = useContext(logincontext);

  const [Data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/home?user_id=${loginUser.user_id}`);
        setData(response.data);
      } catch (err) {
        console.log(err.response?.status);
      }
    };

    fetchData();
  }, []);

  const { number: amountAnimation } = useSpring({
    from: { number: 0 },
    number: Data?.totalamount || 0,
    config: { duration: 1500 },
  });

  const { number: componentsAnimation } = useSpring({
    from: { number: 0 },
    number: Data?.totalcomponents || 0,
    config: { duration: 1500 },
  });

  const { number: vendorAnimation } = useSpring({
    from: { number: 0 },
    number: Data?.totalvendors || 0,
    config: { duration: 1500 },
  });

  const { number: uniquecomponentsAnimation } = useSpring({
    from: { number: 0 },
    number: Data?.uniquecomponents || 0,
    config: { duration: 1500 },
  });

  const { number: initialamountAnimation } = useSpring({
    from: { number: 0 },
    number: Data?.initialamount || 0,
    config: { duration: 1500 },
  });

  const { number: CGSTAnimation } = useSpring({
    from: { number: 0 },
    number: Data?.cgst || 0,
    config: { duration: 1500 },
  });

  const { number: SGSTAnimation } = useSpring({
    from: { number: 0 },
    number: Data?.sgst || 0,
    config: { duration: 1500 },
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        height: "80vh",
      }}
    >
      {Data !== null && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "7rem",
            }}
          >
            <div className="text-center">
              <animated.div style={{ fontSize: "5rem" }} className="display-1 d-inline">
                {CGSTAnimation.to((n) => Math.round(n))}
              </animated.div>
              
              <h5 className="pt-2">9% CGST</h5>
            </div>

            <div className="text-center">
              <animated.div style={{ fontSize: "5rem" }} className="display-1">
                {initialamountAnimation.to((n) => Math.round(n))}
              </animated.div>
              <h5 className="pt-2">Total Cost</h5>
            </div>
            <div className="text-center">
              <animated.div style={{ fontSize: "5rem" }} className="display-1 d-inline">
                {SGSTAnimation.to((n) => Math.round(n))}
              </animated.div>
              
              <h5 className="pt-2">9% SGST</h5>
            </div>
          </div>

          <div className="text-center">
            <animated.div
              style={{ fontSize: "10rem" }}
              className="display-1 text-center"
            >
              {amountAnimation.to((n) => Math.round(n))}
            </animated.div>
            <h5 className="py-2">Amount Spent</h5>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10rem",
            }}
          >
            <div className="text-center">
              <animated.div style={{ fontSize: "5rem" }} className="display-1">
                {componentsAnimation.to((n) => Math.round(n))}
              </animated.div>
              <h5 className="py-2">Components In The Store</h5>
            </div>

            <div className="text-center">
              <animated.div style={{ fontSize: "5rem" }} className="display-1">
                {vendorAnimation.to((n) => Math.round(n))}
              </animated.div>
              <h5 className="py-2">Vendors</h5>
            </div>

            <div className="text-center">
              <animated.div style={{ fontSize: "5rem" }} className="display-1">
                {uniquecomponentsAnimation.to((n) => Math.round(n))}
              </animated.div>
              <h5 className="py-2">Unique Components</h5>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
