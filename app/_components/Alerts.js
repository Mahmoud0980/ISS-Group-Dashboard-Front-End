import React from "react";

export default function Alerts({ body, className }) {
  return (
    <div
      className={className}
      role="alert"
      style={{
        zIndex: "1000000",
        width: "300px",
        textAlign: "center",
        right: "0",
        left: "0",
        top: "10px",
        margin: "auto",
      }}
    >
      {body}
    </div>
  );
}
