unit Fenix.Service.Customer;

interface

uses
  System.SysUtils,
  FireDAC.Comp.Client,
  Fenix.DM.Connection,
  Fenix.Model.Customer;

type
  TCustomerService = class
  private
    FConnectionDM: TDMConnection;
  public
    constructor Create(AConnectionDM: TDMConnection);
    procedure LoadToQuery(AQuery: TFDQuery);
    procedure Save(ACustomer: TCustomer);
    procedure Delete(const ACustomerId: string);
  end;

implementation

constructor TCustomerService.Create(AConnectionDM: TDMConnection);
begin
  inherited Create;
  FConnectionDM := AConnectionDM;
end;

procedure TCustomerService.LoadToQuery(AQuery: TFDQuery);
begin
  FConnectionDM.Connect;

  AQuery.Close;
  AQuery.Connection := FConnectionDM.FDConnection;
  AQuery.SQL.Text :=
    'select id, full_name, document_number, phone_1, whatsapp, email, address_line, city, state_code, notes ' +
    'from customers ' +
    'where is_active = true ' +
    'order by full_name';
  AQuery.Open;
end;

procedure TCustomerService.Save(ACustomer: TCustomer);
begin
  if ACustomer = nil then
    raise Exception.Create('Cliente invalido.');

  if Trim(ACustomer.FullName) = '' then
    raise Exception.Create('Informe o nome do cliente.');

  FConnectionDM.Connect;

  if Trim(ACustomer.Id) = '' then
  begin
    with TFDQuery.Create(nil) do
    try
      Connection := FConnectionDM.FDConnection;
      SQL.Text :=
        'insert into customers (' +
        '  full_name, document_number, phone_1, whatsapp, email, address_line, city, state_code, notes, is_active' +
        ') values (' +
        '  :full_name, :document_number, :phone_1, :whatsapp, :email, :address_line, :city, :state_code, :notes, true' +
        ')';
      ParamByName('full_name').AsString := Trim(ACustomer.FullName);
      ParamByName('document_number').AsString := Trim(ACustomer.DocumentNumber);
      ParamByName('phone_1').AsString := Trim(ACustomer.Phone1);
      ParamByName('whatsapp').AsString := Trim(ACustomer.Whatsapp);
      ParamByName('email').AsString := Trim(ACustomer.Email);
      ParamByName('address_line').AsString := Trim(ACustomer.AddressLine);
      ParamByName('city').AsString := Trim(ACustomer.City);
      ParamByName('state_code').AsString := Trim(ACustomer.StateCode);
      ParamByName('notes').AsString := Trim(ACustomer.Notes);
      ExecSQL;
    finally
      Free;
    end;
  end
  else
  begin
    with TFDQuery.Create(nil) do
    try
      Connection := FConnectionDM.FDConnection;
      SQL.Text :=
        'update customers set ' +
        '  full_name = :full_name, ' +
        '  document_number = :document_number, ' +
        '  phone_1 = :phone_1, ' +
        '  whatsapp = :whatsapp, ' +
        '  email = :email, ' +
        '  address_line = :address_line, ' +
        '  city = :city, ' +
        '  state_code = :state_code, ' +
        '  notes = :notes, ' +
        '  updated_at = current_timestamp ' +
        'where id = :id';
      ParamByName('id').AsString := ACustomer.Id;
      ParamByName('full_name').AsString := Trim(ACustomer.FullName);
      ParamByName('document_number').AsString := Trim(ACustomer.DocumentNumber);
      ParamByName('phone_1').AsString := Trim(ACustomer.Phone1);
      ParamByName('whatsapp').AsString := Trim(ACustomer.Whatsapp);
      ParamByName('email').AsString := Trim(ACustomer.Email);
      ParamByName('address_line').AsString := Trim(ACustomer.AddressLine);
      ParamByName('city').AsString := Trim(ACustomer.City);
      ParamByName('state_code').AsString := Trim(ACustomer.StateCode);
      ParamByName('notes').AsString := Trim(ACustomer.Notes);
      ExecSQL;
    finally
      Free;
    end;
  end;
end;

procedure TCustomerService.Delete(const ACustomerId: string);
begin
  if Trim(ACustomerId) = '' then
    raise Exception.Create('Cliente invalido para exclusao.');

  FConnectionDM.Connect;

  with TFDQuery.Create(nil) do
  try
    Connection := FConnectionDM.FDConnection;
    SQL.Text :=
      'update customers set is_active = false, updated_at = current_timestamp where id = :id';
    ParamByName('id').AsString := ACustomerId;
    ExecSQL;
  finally
    Free;
  end;
end;

end.
