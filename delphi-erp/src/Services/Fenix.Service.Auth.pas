unit Fenix.Service.Auth;

interface

uses
  System.SysUtils,
  FireDAC.Comp.Client,
  Fenix.Model.User,
  Fenix.Utils.Crypto,
  Fenix.DM.Connection;

type
  TAuthService = class
  private
    FConnectionDM: TDMConnection;
  public
    constructor Create(AConnectionDM: TDMConnection);
    function HasUsers: Boolean;
    function Authenticate(const ALoginName, APassword: string): TAuthenticatedUser;
  end;

implementation

constructor TAuthService.Create(AConnectionDM: TDMConnection);
begin
  inherited Create;
  FConnectionDM := AConnectionDM;
end;

function TAuthService.HasUsers: Boolean;
var
  LQuery: TFDQuery;
begin
  FConnectionDM.Connect;

  LQuery := TFDQuery.Create(nil);
  try
    LQuery.Connection := FConnectionDM.FDConnection;
    LQuery.SQL.Text := 'select count(*) as total_users from users';
    LQuery.Open;
    Result := LQuery.FieldByName('total_users').AsInteger > 0;
  finally
    LQuery.Free;
  end;
end;

function TAuthService.Authenticate(const ALoginName, APassword: string): TAuthenticatedUser;
var
  LQuery: TFDQuery;
  LPasswordHash: string;
  LSalt: string;
  LPepper: string;
begin
  Result := nil;
  FConnectionDM.Connect;

  LQuery := TFDQuery.Create(nil);
  try
    LQuery.Connection := FConnectionDM.FDConnection;
    LQuery.SQL.Text :=
      'select u.id, u.full_name, u.login_name, u.password_hash, u.password_salt, ' +
      'coalesce(r.name, '''') as role_name ' +
      'from users u ' +
      'left join roles r on r.id = u.role_id ' +
      'where u.login_name = :login_name and u.is_active = true';
    LQuery.ParamByName('login_name').AsString := Trim(ALoginName);
    LQuery.Open;

    if LQuery.IsEmpty then
      raise Exception.Create('Usuario ou senha invalidos.');

    LSalt := LQuery.FieldByName('password_salt').AsString;
    LPepper := FConnectionDM.Settings.Security.Pepper;
    LPasswordHash := TCryptoUtils.HashPassword(APassword, LSalt, LPepper);

    if not SameText(LPasswordHash, LQuery.FieldByName('password_hash').AsString) then
      raise Exception.Create('Usuario ou senha invalidos.');

    Result := TAuthenticatedUser.Create;
    Result.Id := LQuery.FieldByName('id').AsString;
    Result.FullName := LQuery.FieldByName('full_name').AsString;
    Result.LoginName := LQuery.FieldByName('login_name').AsString;
    Result.RoleName := LQuery.FieldByName('role_name').AsString;
    Result.SessionToken := TCryptoUtils.GenerateSessionToken;
  finally
    LQuery.Free;
  end;
end;

end.
