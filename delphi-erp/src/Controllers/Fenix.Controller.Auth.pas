unit Fenix.Controller.Auth;

interface

uses
  Fenix.Service.Auth,
  Fenix.Model.User;

type
  TAuthController = class
  private
    FAuthService: TAuthService;
  public
    constructor Create(AAuthService: TAuthService);
    destructor Destroy; override;
    function Login(const ALoginName, APassword: string): TAuthenticatedUser;
    function HasUsers: Boolean;
  end;

implementation

constructor TAuthController.Create(AAuthService: TAuthService);
begin
  inherited Create;
  FAuthService := AAuthService;
end;

destructor TAuthController.Destroy;
begin
  FAuthService.Free;
  inherited;
end;

function TAuthController.HasUsers: Boolean;
begin
  Result := FAuthService.HasUsers;
end;

function TAuthController.Login(const ALoginName, APassword: string): TAuthenticatedUser;
begin
  Result := FAuthService.Authenticate(ALoginName, APassword);
end;

end.
