unit Fenix.Model.User;

interface

uses
  Fenix.Model.Base;

type
  TUserRole = class(TEntityBase)
  private
    FName: string;
  public
    property Name: string read FName write FName;
  end;

  TAuthenticatedUser = class(TEntityBase)
  private
    FFullName: string;
    FLoginName: string;
    FRoleName: string;
    FSessionToken: string;
  public
    property FullName: string read FFullName write FFullName;
    property LoginName: string read FLoginName write FLoginName;
    property RoleName: string read FRoleName write FRoleName;
    property SessionToken: string read FSessionToken write FSessionToken;
  end;

implementation

end.
