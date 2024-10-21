import { useAppSelector } from "../Store";

const LoggedInView = () => {
  const ascendon = useAppSelector(state => state.f1tv.ascendon);
  const entitlement = useAppSelector(state => state.f1tv.entitlement);

  return (
    <>
      <h2>{`Logged in as ${ascendon.FirstName} ${ascendon.LastName}!`}</h2>
      {<h2>Entitlement: {entitlement !== null ? 'Available' : 'Not available'}</h2>}
      {<h2>Subscription Status: {ascendon.SubscriptionStatus}</h2>}
      {ascendon.SubscriptionStatus === 'active' && <h2>Subscription Product: {ascendon.SubscribedProduct}</h2>}
      <button onClick={() => f1tv.logout()}>Logout</button>
    </>
  );
};

export default LoggedInView;
