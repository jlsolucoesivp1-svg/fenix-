unit Fenix.Service.Bootstrap;

interface

uses
  System.SysUtils,
  FireDAC.Comp.Client,
  Fenix.DM.Connection,
  Fenix.Utils.Crypto;

type
  TBootstrapService = class
  private
    FConnectionDM: TDMConnection;
    function EnsureDefaultCompany(AQuery: TFDQuery): string;
    function EnsureAdminRole(AQuery: TFDQuery; const ACompanyId: string): string;
    procedure EnsureAdminPermissions(AQuery: TFDQuery; const ARoleId: string);
  public
    constructor Create(AConnectionDM: TDMConnection);
    function HasUsers: Boolean;
    procedure CreateInitialAdmin(
      const AFullName, ALoginName, APassword, AEmail: string
    );
  end;

implementation

constructor TBootstrapService.Create(AConnectionDM: TDMConnection);
begin
  inherited Create;
  FConnectionDM := AConnectionDM;
end;

function TBootstrapService.HasUsers: Boolean;
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

function TBootstrapService.EnsureDefaultCompany(AQuery: TFDQuery): string;
begin
  AQuery.Close;
  AQuery.SQL.Text :=
    'select id from companies order by created_at fetch first 1 row only';
  AQuery.Open;

  if not AQuery.IsEmpty then
    Exit(AQuery.Fields[0].AsString);

  AQuery.Close;
  AQuery.SQL.Text :=
    'insert into companies (trade_name, legal_name, is_active) ' +
    'values (:trade_name, :legal_name, true) returning id';
  AQuery.ParamByName('trade_name').AsString := 'Fenix ERP';
  AQuery.ParamByName('legal_name').AsString := 'Fenix ERP';
  AQuery.Open;
  Result := AQuery.Fields[0].AsString;
end;

function TBootstrapService.EnsureAdminRole(AQuery: TFDQuery; const ACompanyId: string): string;
begin
  AQuery.Close;
  AQuery.SQL.Text :=
    'select id from roles where company_id = :company_id and upper(name) = upper(:role_name) ' +
    'fetch first 1 row only';
  AQuery.ParamByName('company_id').AsString := ACompanyId;
  AQuery.ParamByName('role_name').AsString := 'Administrador';
  AQuery.Open;

  if not AQuery.IsEmpty then
    Exit(AQuery.Fields[0].AsString);

  AQuery.Close;
  AQuery.SQL.Text :=
    'insert into roles (company_id, name, description, is_system) ' +
    'values (:company_id, :name, :description, true) returning id';
  AQuery.ParamByName('company_id').AsString := ACompanyId;
  AQuery.ParamByName('name').AsString := 'Administrador';
  AQuery.ParamByName('description').AsString := 'Acesso total ao sistema';
  AQuery.Open;
  Result := AQuery.Fields[0].AsString;
end;

procedure TBootstrapService.EnsureAdminPermissions(AQuery: TFDQuery; const ARoleId: string);
begin
  AQuery.Close;
  AQuery.SQL.Text :=
    'insert into role_permissions (role_id, permission_id) ' +
    'select :role_id, p.id from permissions p ' +
    'where not exists (' +
    '  select 1 from role_permissions rp ' +
    '  where rp.role_id = :role_id_check and rp.permission_id = p.id' +
    ')';
  AQuery.ParamByName('role_id').AsString := ARoleId;
  AQuery.ParamByName('role_id_check').AsString := ARoleId;
  AQuery.ExecSQL;
end;

procedure TBootstrapService.CreateInitialAdmin(
  const AFullName, ALoginName, APassword, AEmail: string
);
var
  LQuery: TFDQuery;
  LSalt: string;
  LPasswordHash: string;
  LCompanyId: string;
  LRoleId: string;
begin
  if Trim(AFullName) = '' then
    raise Exception.Create('Informe o nome do administrador.');

  if Trim(ALoginName) = '' then
    raise Exception.Create('Informe o login do administrador.');

  if Length(Trim(APassword)) < 6 then
    raise Exception.Create('A senha inicial deve ter pelo menos 6 caracteres.');

  if HasUsers then
    raise Exception.Create('Ja existem usuarios cadastrados no sistema.');

  FConnectionDM.Connect;
  FConnectionDM.FDConnection.StartTransaction;
  LQuery := TFDQuery.Create(nil);
  try
    LQuery.Connection := FConnectionDM.FDConnection;

    LCompanyId := EnsureDefaultCompany(LQuery);
    LRoleId := EnsureAdminRole(LQuery, LCompanyId);
    EnsureAdminPermissions(LQuery, LRoleId);

    LSalt := TCryptoUtils.GenerateSalt;
    LPasswordHash := TCryptoUtils.HashPassword(
      Trim(APassword),
      LSalt,
      FConnectionDM.Settings.Security.Pepper
    );

    LQuery.Close;
    LQuery.SQL.Text :=
      'insert into users (' +
      '  company_id, role_id, full_name, login_name, email, password_hash, password_salt, is_active' +
      ') values (' +
      '  :company_id, :role_id, :full_name, :login_name, :email, :password_hash, :password_salt, true' +
      ')';
    LQuery.ParamByName('company_id').AsString := LCompanyId;
    LQuery.ParamByName('role_id').AsString := LRoleId;
    LQuery.ParamByName('full_name').AsString := Trim(AFullName);
    LQuery.ParamByName('login_name').AsString := Trim(ALoginName);
    LQuery.ParamByName('email').AsString := Trim(AEmail);
    LQuery.ParamByName('password_hash').AsString := LPasswordHash;
    LQuery.ParamByName('password_salt').AsString := LSalt;
    LQuery.ExecSQL;

    LQuery.Close;
    LQuery.SQL.Text :=
      'insert into access_logs (login_name, event_type, details, machine_name) ' +
      'values (:login_name, :event_type, :details, :machine_name)';
    LQuery.ParamByName('login_name').AsString := Trim(ALoginName);
    LQuery.ParamByName('event_type').AsString := 'bootstrap_admin';
    LQuery.ParamByName('details').AsString := 'Administrador inicial criado.';
    LQuery.ParamByName('machine_name').AsString := GetEnvironmentVariable('COMPUTERNAME');
    LQuery.ExecSQL;

    FConnectionDM.FDConnection.Commit;
  except
    if FConnectionDM.FDConnection.InTransaction then
      FConnectionDM.FDConnection.Rollback;
    raise;
  finally
    LQuery.Free;
  end;
end;

end.
