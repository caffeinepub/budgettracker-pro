import Map "mo:core/Map";

(with migration = func (old : {
  accessControlState : {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, { #admin; #guest; #user }>;
  };
  var configuration : ?{ secretKey : Text; allowedCountries : [Text] };
  userProfiles : Map.Map<Principal, { name : Text }>;
}) : {} {
  ignore old;
  {}
})
actor {
  // WIZ is a frontend-only offline PWA.
  // All user data is stored in localStorage — this backend actor is not used.
};
