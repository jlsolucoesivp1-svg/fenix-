unit Fenix.Controller.Bootstrap;

interface

uses
  Fenix.Service.Bootstrap;

type
  TBootstrapController = class
  private
    FBootstrapService: TBootstrapService;
  public
    constructor Create(ABootstrapService: TBootstrapService);
    destructor Destroy; override;
    function HasUsers: Boolean;
    procedure CreateInitialAdmin(
      const AFullName, ALoginName, APassword, AEmail: string
    );
  end;

implementation

constructor TBootstrapController.Create(ABootstrapService: TBootstrapService);
begin
  inherited Create;
  FBootstrapService := ABootstrapService;
end;

destructor TBootstrapController.Destroy;
begin
  FBootstrapService.Free;
  inherited;
end;

function TBootstrapController.HasUsers: Boolean;
begin
  Result := FBootstrapService.HasUsers;
end;

procedure TBootstrapController.CreateInitialAdmin(
  const AFullName, ALoginName, APassword, AEmail: string
);
begin
  FBootstrapService.CreateInitialAdmin(AFullName, ALoginName, APassword, AEmail);
end;

end.
