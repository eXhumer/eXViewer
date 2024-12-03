const LoggedOut = () => {
  return (
    <div
      // center align all text and components
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <p>You must be logged into F1TV to use this application</p>
      <button onClick={() => f1tv.login()}>
        Login with formula1.com
      </button>
    </div>
  );
};

export default LoggedOut;
