const LoggedOutView = () => {
  return (
    <>
      <p>You must be logged into F1TV to use this application</p>
      <button onClick={() => f1tv.login()}>
        Login with formula1.com
      </button>
    </>
  );
};

export default LoggedOutView;
