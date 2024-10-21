const LoggedOutView = () => {
  return (
    <>
      <p> Please login to start watching content. </p>
      <button onClick={() => f1tv.login()}> Login </button>
    </>
  );
};

export default LoggedOutView;
