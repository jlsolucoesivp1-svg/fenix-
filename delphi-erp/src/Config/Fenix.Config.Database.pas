unit Fenix.Config.Database;

interface

type
  TDatabaseSettings = record
    Server: string;
    Port: Integer;
    Database: string;
    UserName: string;
    Password: string;
  end;

implementation

end.
