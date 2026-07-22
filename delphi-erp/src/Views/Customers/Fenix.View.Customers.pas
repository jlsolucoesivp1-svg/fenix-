unit Fenix.View.Customers;

interface

uses
  Winapi.Windows,
  Winapi.Messages,
  System.SysUtils,
  System.Variants,
  System.Classes,
  Vcl.Graphics,
  Vcl.Controls,
  Vcl.Forms,
  Vcl.Dialogs,
  Vcl.ExtCtrls,
  Vcl.StdCtrls,
  Vcl.DBGrids,
  Data.DB,
  FireDAC.Comp.Client,
  Fenix.Controller.Customer,
  Fenix.Service.Customer,
  Fenix.DM.Connection,
  Fenix.Model.Customer;

type
  TFrmCustomers = class(TForm)
    PnlTop: TPanel;
    PnlGrid: TPanel;
    PnlForm: TPanel;
    GridCustomers: TDBGrid;
    DsCustomers: TDataSource;
    BtnNew: TButton;
    BtnSave: TButton;
    BtnDelete: TButton;
    BtnRefresh: TButton;
    LblTitle: TLabel;
    EdtName: TEdit;
    EdtDocument: TEdit;
    EdtPhone: TEdit;
    EdtWhatsapp: TEdit;
    EdtEmail: TEdit;
    EdtAddress: TEdit;
    EdtCity: TEdit;
    EdtState: TEdit;
    MemoNotes: TMemo;
    LblName: TLabel;
    LblDocument: TLabel;
    LblPhone: TLabel;
    LblWhatsapp: TLabel;
    LblEmail: TLabel;
    LblAddress: TLabel;
    LblCity: TLabel;
    LblState: TLabel;
    LblNotes: TLabel;
    LblStatus: TLabel;
    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure BtnRefreshClick(Sender: TObject);
    procedure BtnNewClick(Sender: TObject);
    procedure BtnSaveClick(Sender: TObject);
    procedure BtnDeleteClick(Sender: TObject);
    procedure GridCustomersCellClick(Column: TColumn);
  private
    FController: TCustomerController;
    FQueryCustomers: TFDQuery;
    FCurrentCustomerId: string;
    procedure InitializeDependencies;
    procedure LoadCustomers;
    procedure LoadCurrentRecordToForm;
    procedure ClearForm;
    function BuildCustomerFromForm: TCustomer;
  public
  end;

implementation

{$R *.dfm}

procedure TFrmCustomers.FormCreate(Sender: TObject);
begin
  Color := $0014171B;
  PnlTop.Color := $00222931;
  PnlGrid.Color := $0014171B;
  PnlForm.Color := $001D2228;

  InitializeDependencies;
  LoadCustomers;
  ClearForm;
end;

procedure TFrmCustomers.FormDestroy(Sender: TObject);
begin
  FQueryCustomers.Free;
  FController.Free;
end;

procedure TFrmCustomers.InitializeDependencies;
begin
  FController := TCustomerController.Create(TCustomerService.Create(DMConnection));
  FQueryCustomers := TFDQuery.Create(nil);
  DsCustomers.DataSet := FQueryCustomers;
end;

procedure TFrmCustomers.LoadCustomers;
begin
  FController.LoadToQuery(FQueryCustomers);
  if not FQueryCustomers.IsEmpty then
    LoadCurrentRecordToForm
  else
    ClearForm;
end;

procedure TFrmCustomers.LoadCurrentRecordToForm;
begin
  if FQueryCustomers.IsEmpty then
  begin
    ClearForm;
    Exit;
  end;

  FCurrentCustomerId := FQueryCustomers.FieldByName('id').AsString;
  EdtName.Text := FQueryCustomers.FieldByName('full_name').AsString;
  EdtDocument.Text := FQueryCustomers.FieldByName('document_number').AsString;
  EdtPhone.Text := FQueryCustomers.FieldByName('phone_1').AsString;
  EdtWhatsapp.Text := FQueryCustomers.FieldByName('whatsapp').AsString;
  EdtEmail.Text := FQueryCustomers.FieldByName('email').AsString;
  EdtAddress.Text := FQueryCustomers.FieldByName('address_line').AsString;
  EdtCity.Text := FQueryCustomers.FieldByName('city').AsString;
  EdtState.Text := FQueryCustomers.FieldByName('state_code').AsString;
  MemoNotes.Lines.Text := FQueryCustomers.FieldByName('notes').AsString;
end;

procedure TFrmCustomers.ClearForm;
begin
  FCurrentCustomerId := '';
  EdtName.Clear;
  EdtDocument.Clear;
  EdtPhone.Clear;
  EdtWhatsapp.Clear;
  EdtEmail.Clear;
  EdtAddress.Clear;
  EdtCity.Clear;
  EdtState.Clear;
  MemoNotes.Clear;
  LblStatus.Caption := '';
end;

function TFrmCustomers.BuildCustomerFromForm: TCustomer;
begin
  Result := TCustomer.Create;
  Result.Id := FCurrentCustomerId;
  Result.FullName := EdtName.Text;
  Result.DocumentNumber := EdtDocument.Text;
  Result.Phone1 := EdtPhone.Text;
  Result.Whatsapp := EdtWhatsapp.Text;
  Result.Email := EdtEmail.Text;
  Result.AddressLine := EdtAddress.Text;
  Result.City := EdtCity.Text;
  Result.StateCode := EdtState.Text;
  Result.Notes := MemoNotes.Lines.Text;
end;

procedure TFrmCustomers.BtnRefreshClick(Sender: TObject);
begin
  LoadCustomers;
end;

procedure TFrmCustomers.BtnNewClick(Sender: TObject);
begin
  ClearForm;
  EdtName.SetFocus;
end;

procedure TFrmCustomers.BtnSaveClick(Sender: TObject);
var
  LCustomer: TCustomer;
begin
  LCustomer := BuildCustomerFromForm;
  try
    FController.Save(LCustomer);
    LblStatus.Font.Color := clLime;
    LblStatus.Caption := 'Cliente salvo com sucesso.';
    LoadCustomers;
  except
    on E: Exception do
    begin
      LblStatus.Font.Color := clRed;
      LblStatus.Caption := E.Message;
    end;
  end;
  LCustomer.Free;
end;

procedure TFrmCustomers.BtnDeleteClick(Sender: TObject);
begin
  if Trim(FCurrentCustomerId) = '' then
    Exit;

  if MessageDlg('Deseja excluir este cliente?', mtConfirmation, [mbYes, mbNo], 0) <> mrYes then
    Exit;

  try
    FController.Delete(FCurrentCustomerId);
    LblStatus.Font.Color := clLime;
    LblStatus.Caption := 'Cliente excluido com sucesso.';
    LoadCustomers;
  except
    on E: Exception do
    begin
      LblStatus.Font.Color := clRed;
      LblStatus.Caption := E.Message;
    end;
  end;
end;

procedure TFrmCustomers.GridCustomersCellClick(Column: TColumn);
begin
  LoadCurrentRecordToForm;
end;

end.
