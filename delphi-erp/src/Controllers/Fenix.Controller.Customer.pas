unit Fenix.Controller.Customer;

interface

uses
  FireDAC.Comp.Client,
  Fenix.Service.Customer,
  Fenix.Model.Customer;

type
  TCustomerController = class
  private
    FCustomerService: TCustomerService;
  public
    constructor Create(ACustomerService: TCustomerService);
    destructor Destroy; override;
    procedure LoadToQuery(AQuery: TFDQuery);
    procedure Save(ACustomer: TCustomer);
    procedure Delete(const ACustomerId: string);
  end;

implementation

constructor TCustomerController.Create(ACustomerService: TCustomerService);
begin
  inherited Create;
  FCustomerService := ACustomerService;
end;

destructor TCustomerController.Destroy;
begin
  FCustomerService.Free;
  inherited;
end;

procedure TCustomerController.LoadToQuery(AQuery: TFDQuery);
begin
  FCustomerService.LoadToQuery(AQuery);
end;

procedure TCustomerController.Save(ACustomer: TCustomer);
begin
  FCustomerService.Save(ACustomer);
end;

procedure TCustomerController.Delete(const ACustomerId: string);
begin
  FCustomerService.Delete(ACustomerId);
end;

end.
