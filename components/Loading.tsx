"use client";

import React from "react";

const Loading = () => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", width: "50px", height: "50px" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "#3B82F6",
              borderRadius: "50%",
              animation: "ping 1.5s ease-in-out infinite",
              opacity: 0.75,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "#3B82F6",
              borderRadius: "50%",
              opacity: 0.3,
            }}
          />
        </div>
      </div>
    </>
  );
};

const styles = `
  @keyframes ping {
    0% {
      transform: scale(1);
      opacity: 0.75;
    }
    75% {
      transform: scale(1.5);
      opacity: 0;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
`;

export default Loading;
